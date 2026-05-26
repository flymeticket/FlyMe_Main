/**
 * One-shot data fix for OpenFlights CSV typos in Indian airport city names.
 *
 * For each correction this script:
 *   1. Updates airports.city (and rebuilds related route fields downstream)
 *   2. Recomputes the slug on every route where origin or destination IATA is
 *      affected, since the slug ("ludhiana-to-mangalore") embeds the city name
 *   3. Resets status='pending' on every affected route that was already
 *      'published', so the next batch run regenerates meta_title /
 *      meta_description / hero_md / history_md / faqs with the correct name
 *      (the wrong name is still baked into the GPT-generated text fields)
 *
 * Routes that were still 'pending' just get a new slug — no regen needed
 * because they'll be generated fresh anyway.
 *
 * Idempotent: re-running this when the airport.city is already correct does
 * nothing harmful — slugs are recomputed from canonical data, and only
 * 'published' rows whose slug *actually* changed get reset.
 */
import { getSupabaseAdmin } from '../src/lib/supabase';
import { buildRouteSlug } from '../src/lib/slug';

const CORRECTIONS: Record<string, string> = {
  ajl: 'Aizawl',
  bhu: 'Bhavnagar',
  bup: 'Bathinda',
  coh: 'Cooch Behar',
  dib: 'Dibrugarh',
  luh: 'Ludhiana',
  mzu: 'Muzaffarpur',
  pat: 'Patna',
  pny: 'Puducherry',
  rtc: 'Ratnagiri',
  tir: 'Tirupati',
  vtz: 'Visakhapatnam',
  zer: 'Ziro',
};

async function main() {
  const sb = getSupabaseAdmin();

  // 1. Update airports.city
  console.log('Step 1 — updating airports.city for 13 IATA codes');
  for (const [iata, city] of Object.entries(CORRECTIONS)) {
    const { error } = await sb.from('airports').update({ city }).eq('iata', iata);
    if (error) throw new Error(`update ${iata}: ${error.message}`);
    process.stdout.write(`  ${iata} → ${city}\n`);
  }

  // 2. Build canonical {iata → city} map for ALL airports (not just India) —
  //    a corrected India IATA might still be paired with an international
  //    airport in the routes table (e.g. VTZ ↔ SIN). Paginate in 1K chunks
  //    because Supabase caps a single response at 1,000 rows.
  const iataToCity = new Map<string, string>();
  const PAGE = 1000;
  for (let off = 0; ; off += PAGE) {
    const { data } = await sb
      .from('airports')
      .select('iata, city')
      .order('iata')
      .range(off, off + PAGE - 1);
    const page = data ?? [];
    for (const a of page) iataToCity.set(a.iata, a.city);
    if (page.length < PAGE) break;
  }
  console.log(`Loaded ${iataToCity.size} airports for lookup`);

  // 3. Find all routes touching any corrected IATA (origin OR destination).
  const affectedIatas = Object.keys(CORRECTIONS);
  const { data: originHits } = await sb
    .from('routes')
    .select('id, origin_iata, destination_iata, slug, status')
    .in('origin_iata', affectedIatas);
  const { data: destHits } = await sb
    .from('routes')
    .select('id, origin_iata, destination_iata, slug, status')
    .in('destination_iata', affectedIatas);

  // Dedupe — a route where both ends are affected appears in both lists.
  const seen = new Set<string>();
  const affected = [...(originHits ?? []), ...(destHits ?? [])].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  console.log(`\nStep 2 — recomputing slugs for ${affected.length} affected routes`);

  // 4. For each, compute the correct slug and update.
  //    Also collect IDs whose status='published' AND slug actually changed, so
  //    we can reset them to 'pending' for regeneration.
  const toResetForRegen: string[] = [];
  let slugsChanged = 0;
  let unchanged = 0;
  for (const r of affected) {
    const oCity = iataToCity.get(r.origin_iata);
    const dCity = iataToCity.get(r.destination_iata);
    if (!oCity || !dCity) {
      console.warn(`  ⚠ missing city for ${r.origin_iata}/${r.destination_iata}, skipping`);
      continue;
    }
    const newSlug = buildRouteSlug(oCity, dCity);
    if (newSlug === r.slug) {
      unchanged += 1;
      continue;
    }
    const { error } = await sb.from('routes').update({ slug: newSlug }).eq('id', r.id);
    if (error) throw new Error(`update slug ${r.id}: ${error.message}`);
    slugsChanged += 1;
    if (r.status === 'published') toResetForRegen.push(r.id);
  }
  console.log(`  ${slugsChanged} slugs updated, ${unchanged} already correct`);

  // 5. Reset affected published rows to 'pending' so their GPT-generated
  //    meta/hero/history/FAQ fields get regenerated with the right city name.
  console.log(
    `\nStep 3 — resetting ${toResetForRegen.length} published rows to 'pending' for regeneration`,
  );
  const CHUNK = 200;
  for (let i = 0; i < toResetForRegen.length; i += CHUNK) {
    const slice = toResetForRegen.slice(i, i + CHUNK);
    const { error } = await sb.from('routes').update({ status: 'pending' }).in('id', slice);
    if (error) throw new Error(`reset chunk: ${error.message}`);
  }

  console.log('\nDone.');
  console.log(`  Airports corrected:           13`);
  console.log(`  Route slugs updated:          ${slugsChanged}`);
  console.log(`  Published rows back to pend:  ${toResetForRegen.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
