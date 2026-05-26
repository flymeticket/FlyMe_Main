import { getSupabasePublic } from './supabase';
import { env } from './env';
import type { AirportRow, RouteRow } from './database.types';

export interface RouteWithAirports {
  route: RouteRow;
  origin: AirportRow;
  destination: AirportRow;
}

// True only when public Supabase env vars are real, not the placeholder fallbacks.
// Until the user wires up Supabase, every query returns null/[] so the build still
// passes and pages render an empty state.
function supabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);
}

// A row is publicly "live" iff it's been generated (status=published) AND it
// belongs to a release wave we've unlocked. Caller code never special-cases
// the wave gate — they just call these helpers.
const CURRENT_WAVE = env.currentReleaseWave;

// Look up a route by (origin, destination) IATA pair. Returns null when the
// route is missing OR not yet eligible for serving in this wave. Demo data /
// build-time previews still render via their own static page.
export async function getRouteByPair(
  originIata: string,
  destinationIata: string
): Promise<RouteWithAirports | null> {
  if (!supabaseConfigured()) return null;
  const supabase = getSupabasePublic();
  const { data: route } = await supabase
    .from('routes')
    .select('*')
    .eq('origin_iata', originIata.toLowerCase())
    .eq('destination_iata', destinationIata.toLowerCase())
    .eq('status', 'published')
    .lte('release_wave', CURRENT_WAVE)
    .maybeSingle();

  if (!route) return null;

  const [{ data: origin }, { data: destination }] = await Promise.all([
    supabase.from('airports').select('*').eq('iata', route.origin_iata).maybeSingle(),
    supabase.from('airports').select('*').eq('iata', route.destination_iata).maybeSingle(),
  ]);

  if (!origin || !destination) return null;
  return { route, origin, destination };
}

export async function getAirport(iata: string): Promise<AirportRow | null> {
  if (!supabaseConfigured()) return null;
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('airports')
    .select('*')
    .eq('iata', iata.toLowerCase())
    .lte('release_wave', CURRENT_WAVE)
    .maybeSingle();
  return data;
}

// "Other flights from this origin" — internal-linking module. Respects wave.
export async function getOtherRoutesFromOrigin(
  originIata: string,
  excludeDestinationIata: string,
  limit = 8
): Promise<Array<{ route: RouteRow; destination: AirportRow }>> {
  if (!supabaseConfigured()) return [];
  const supabase = getSupabasePublic();
  const { data: routes } = await supabase
    .from('routes')
    .select('*')
    .eq('origin_iata', originIata.toLowerCase())
    .neq('destination_iata', excludeDestinationIata.toLowerCase())
    .eq('status', 'published')
    .lte('release_wave', CURRENT_WAVE)
    .limit(limit);

  if (!routes || routes.length === 0) return [];

  const destIatas = routes.map((r) => r.destination_iata);
  const { data: airports } = await supabase
    .from('airports')
    .select('*')
    .in('iata', destIatas);

  const byIata = new Map((airports ?? []).map((a) => [a.iata, a]));
  return routes
    .map((route) => {
      const destination = byIata.get(route.destination_iata);
      return destination ? { route, destination } : null;
    })
    .filter((x): x is { route: RouteRow; destination: AirportRow } => x !== null);
}

// Given a wishlist of (origin, destination) IATA pairs, return only the ones
// that actually exist as published rows in the current wave, with their real
// canonical slugs. Used by the homepage's "Popular routes" link grid so dead
// pairs don't render dead links.
//
// Lookup key on the returned map is `${origin}-${destination}` (lowercased)
// so callers can index into it without re-querying.
export async function getPublishedSlugsForPairs(
  pairs: Array<{ origin: string; destination: string }>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!supabaseConfigured() || pairs.length === 0) return out;

  // Dedupe origins/destinations so the .in() filters stay compact even if a
  // caller hands us 100 pairs all involving DEL.
  const origins = [...new Set(pairs.map((p) => p.origin.toLowerCase()))];
  const dests   = [...new Set(pairs.map((p) => p.destination.toLowerCase()))];

  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('routes')
    .select('origin_iata,destination_iata,slug')
    .in('origin_iata', origins)
    .in('destination_iata', dests)
    .eq('status', 'published')
    .lte('release_wave', CURRENT_WAVE);

  // Build a wishlist Set so we only keep rows the caller actually asked for —
  // the .in() cross-product can return pairs we didn't request.
  const wanted = new Set(
    pairs.map((p) => `${p.origin.toLowerCase()}-${p.destination.toLowerCase()}`),
  );
  for (const r of data ?? []) {
    const key = `${r.origin_iata}-${r.destination_iata}`;
    if (wanted.has(key)) out.set(key, r.slug);
  }
  return out;
}

// Top routes for build-time prerendering. Respects wave.
export async function getTopRoutesForBuild(limit = 1000): Promise<RouteRow[]> {
  if (!supabaseConfigured()) return [];
  const supabase = getSupabasePublic();
  const { data } = await supabase
    .from('routes')
    .select('*')
    .eq('status', 'published')
    .lte('release_wave', CURRENT_WAVE)
    .limit(limit);
  return data ?? [];
}

// ─── Sitemap helpers ─────────────────────────────────────────────────────
// Sitemap generation streams everything in 50K chunks. These queries fetch
// just the minimum columns needed to build URL entries — full rows would
// blow the heap for a 67K-row table.

export interface SitemapRoute {
  origin_iata: string;
  destination_iata: string;
  slug: string;
  updated_at: string;
}

export async function countLiveRoutes(): Promise<number> {
  if (!supabaseConfigured()) return 0;
  const supabase = getSupabasePublic();
  const { count } = await supabase
    .from('routes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .lte('release_wave', CURRENT_WAVE);
  return count ?? 0;
}

// Supabase Free / Pro tier caps a single PostgREST response at 1,000 rows even
// when .range() asks for more. The sitemap chunk size (45K) blows past that,
// so we paginate internally in 1,000-row sweeps and concatenate. Without this,
// any sitemap with >1,000 live routes silently truncates and Google never sees
// the rest.
const SUPABASE_PAGE = 1000;

export async function getLiveRoutesPage(
  offset: number,
  limit: number
): Promise<SitemapRoute[]> {
  if (!supabaseConfigured()) return [];
  const supabase = getSupabasePublic();
  const all: SitemapRoute[] = [];

  for (let cursor = offset; cursor < offset + limit; cursor += SUPABASE_PAGE) {
    const remaining = offset + limit - cursor;
    const pageSize = Math.min(SUPABASE_PAGE, remaining);
    const { data } = await supabase
      .from('routes')
      .select('origin_iata,destination_iata,slug,updated_at')
      .eq('status', 'published')
      .lte('release_wave', CURRENT_WAVE)
      .order('id')
      .range(cursor, cursor + pageSize - 1);
    const page = (data as SitemapRoute[]) ?? [];
    all.push(...page);
    if (page.length < pageSize) break; // exhausted
  }
  return all;
}

export interface SitemapAirport {
  iata: string;
  updated_at: string;
}

export async function countLiveAirports(): Promise<number> {
  if (!supabaseConfigured()) return 0;
  const supabase = getSupabasePublic();
  const { count } = await supabase
    .from('airports')
    .select('iata', { count: 'exact', head: true })
    .lte('release_wave', CURRENT_WAVE);
  return count ?? 0;
}

export async function getLiveAirportsPage(
  offset: number,
  limit: number
): Promise<SitemapAirport[]> {
  if (!supabaseConfigured()) return [];
  const supabase = getSupabasePublic();
  const all: SitemapAirport[] = [];

  for (let cursor = offset; cursor < offset + limit; cursor += SUPABASE_PAGE) {
    const remaining = offset + limit - cursor;
    const pageSize = Math.min(SUPABASE_PAGE, remaining);
    const { data } = await supabase
      .from('airports')
      .select('iata,updated_at')
      .lte('release_wave', CURRENT_WAVE)
      .order('iata')
      .range(cursor, cursor + pageSize - 1);
    const page = (data as SitemapAirport[]) ?? [];
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}
