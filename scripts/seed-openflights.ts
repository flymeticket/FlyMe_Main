/**
 * Seed Supabase from the OpenFlights public dataset.
 *
 *   airports.dat  → airports table  (~7,700 rows)
 *   routes.dat    → routes table    (~67,000 rows, dedup origin/dest pairs)
 *
 * Run with:   npx tsx scripts/seed-openflights.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local — the script bypasses RLS.
 *
 * The script is idempotent: running it again upserts airports and inserts only
 * new routes. Existing AI-generated content (history_md, faqs, …) is preserved.
 *
 * Data licence: OpenFlights data is published under ODbL. Attribution belongs
 * in the footer of any page derived from it.
 */

// Node 20.6+ loads env via `--env-file=.env.local` flag (see package.json script).
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getSupabaseAdmin } from '../src/lib/supabase';
import { buildRouteSlug } from '../src/lib/slug';

// Prefer local copies under scripts/data/ (checked into the repo) so seeding
// works offline and stays deterministic. Falls back to GitHub if the local
// file is missing — useful in CI or fresh clones.
const LOCAL_AIRPORTS = resolve(__dirname, 'data', 'airports.dat');
const LOCAL_ROUTES   = resolve(__dirname, 'data', 'routes.dat');
const AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
const ROUTES_URL   = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';

// OpenFlights uses CSV with quoted fields and \N for nulls.
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((v) => (v === '\\N' ? '' : v));
}

async function loadDataset(localPath: string, url: string, label: string): Promise<string> {
  if (existsSync(localPath)) {
    console.log(`  ${label}: reading local ${localPath}`);
    return readFile(localPath, 'utf-8');
  }
  console.log(`  ${label}: local file not found, downloading from GitHub`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return res.text();
}

interface AirportSeed {
  iata: string;
  icao: string | null;
  name: string;
  city: string;
  country: string;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
}

async function seedAirports(): Promise<Map<string, AirportSeed>> {
  console.log('Downloading airports.dat …');
  const text = await loadDataset(LOCAL_AIRPORTS, AIRPORTS_URL, 'airports');
  const lines = text.split('\n').filter((l) => l.trim());
  const byIata = new Map<string, AirportSeed>();

  for (const line of lines) {
    const cols = parseCsvLine(line);
    // OpenFlights airport schema:
    // 0:id 1:name 2:city 3:country 4:iata 5:icao 6:lat 7:lng 8:alt 9:tz_offset
    // 10:dst 11:tz_db 12:type 13:source
    const [, name, city, country, iataRaw, icao, lat, lng, , , , tzDb] = cols;
    if (!iataRaw || iataRaw.length !== 3) continue;     // skip airports without IATA
    const iata = iataRaw.toLowerCase();

    byIata.set(iata, {
      iata,
      icao: icao || null,
      name: name.replace(/^"|"$/g, ''),
      city: city.replace(/^"|"$/g, ''),
      country: country.replace(/^"|"$/g, ''),
      country_code: null,                               // OpenFlights only gives country name, not code
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      timezone: tzDb || null,
    });
  }

  console.log(`Parsed ${byIata.size} airports.`);

  const supabase = getSupabaseAdmin();
  const rows = Array.from(byIata.values());
  const CHUNK = 500;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('airports')
      .upsert(chunk, { onConflict: 'iata', ignoreDuplicates: false });
    if (error) throw new Error(`airports upsert ${i}: ${error.message}`);
    process.stdout.write(`  airports ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write('\n');
  return byIata;
}

interface RouteSeed {
  origin_iata: string;
  destination_iata: string;
  slug: string;
  airlines: string[];
  status: 'pending';
}

async function seedRoutes(airports: Map<string, AirportSeed>): Promise<void> {
  console.log('Downloading routes.dat …');
  const text = await loadDataset(LOCAL_ROUTES, ROUTES_URL, 'routes');
  const lines = text.split('\n').filter((l) => l.trim());

  // Dedup by (origin, destination) and accumulate airline list.
  const byPair = new Map<string, { airlines: Set<string> }>();

  for (const line of lines) {
    const cols = parseCsvLine(line);
    // OpenFlights route schema:
    // 0:airline 1:airline_id 2:src_iata 3:src_id 4:dst_iata 5:dst_id 6:codeshare 7:stops 8:equipment
    const [airline, , src, , dst, , , stops] = cols;
    if (stops !== '0') continue;                       // direct flights only
    if (!src || !dst || src.length !== 3 || dst.length !== 3) continue;
    const o = src.toLowerCase();
    const d = dst.toLowerCase();
    if (o === d) continue;
    if (!airports.has(o) || !airports.has(d)) continue;

    const key = `${o}|${d}`;
    if (!byPair.has(key)) byPair.set(key, { airlines: new Set() });
    if (airline) byPair.get(key)!.airlines.add(airline);
  }

  console.log(`Parsed ${byPair.size} unique direct routes.`);

  const rows: RouteSeed[] = [];
  for (const [key, { airlines }] of byPair) {
    const [o, d] = key.split('|');
    const oCity = airports.get(o)!.city;
    const dCity = airports.get(d)!.city;
    rows.push({
      origin_iata: o,
      destination_iata: d,
      slug: buildRouteSlug(oCity, dCity),
      airlines: Array.from(airlines),
      status: 'pending',
    });
  }

  const supabase = getSupabaseAdmin();
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    // Use upsert on (origin_iata, destination_iata) so re-runs are safe and
    // existing generated content is not wiped.
    const { error } = await supabase
      .from('routes')
      .upsert(chunk, {
        onConflict: 'origin_iata,destination_iata',
        ignoreDuplicates: true,                        // never overwrite published content
      });
    if (error) throw new Error(`routes upsert ${i}: ${error.message}`);
    process.stdout.write(`  routes ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write('\n');
}

/**
 * For India launch: insert every ordered pair of airports that actually have
 * scheduled service (≈71 airports → 4,970 routes). Real non-stop routes
 * inserted earlier by seedRoutes() are preserved (upsert with ignoreDuplicates).
 * The "ghost" pairs added here become "fly via <hub>" connection pages once
 * Phase 2 generates content for them.
 */
async function seedIndianPermutations(
  airports: Map<string, AirportSeed>,
): Promise<void> {
  console.log('Building India domestic permutations …');

  // 1) Find Indian airports that have AT LEAST ONE real outbound route in
  //    OpenFlights — same set the route-page sitemap will actually render.
  const indianAirports = Array.from(airports.values()).filter(
    (a) => a.country === 'India',
  );
  const supabase = getSupabaseAdmin();
  const { data: activeOrigins } = await supabase
    .from('routes')
    .select('origin_iata')
    .in('origin_iata', indianAirports.map((a) => a.iata));
  const activeIatas = new Set((activeOrigins ?? []).map((r) => r.origin_iata));
  const active = indianAirports.filter((a) => activeIatas.has(a.iata));

  console.log(
    `  ${active.length} Indian airports with service → ` +
    `${active.length * (active.length - 1)} ordered pairs`,
  );

  // 2) Build every ordered pair (A→B, A≠B).
  const rows: RouteSeed[] = [];
  for (const o of active) {
    for (const d of active) {
      if (o.iata === d.iata) continue;
      rows.push({
        origin_iata: o.iata,
        destination_iata: d.iata,
        slug: buildRouteSlug(o.city, d.city),
        airlines: [],                                  // unknown for ghost pairs
        status: 'pending',
      });
    }
  }

  // 3) Bulk upsert — ignoreDuplicates so real OpenFlights rows are untouched.
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('routes')
      .upsert(chunk, {
        onConflict: 'origin_iata,destination_iata',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`india pairs upsert ${i}: ${error.message}`);
    process.stdout.write(`  india pairs ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write('\n');
}

async function main() {
  console.log('FlyMyTicket · OpenFlights seed');
  const airports = await seedAirports();
  await seedRoutes(airports);
  await seedIndianPermutations(airports);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
