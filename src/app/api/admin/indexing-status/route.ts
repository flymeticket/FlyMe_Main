import { getSupabaseAdmin } from '@/lib/supabase';
import { env } from '@/lib/env';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/admin/indexing-status
//
// Snapshot of the indexing pipeline state. Useful as the data source for an
// internal dashboard, a Slack bot, or a weekly digest cron.
//
// Headers: Authorization: Bearer <ADMIN_TOKEN>

export const runtime = 'nodejs';

interface StatusByWave {
  wave: number;
  count: number;
}

export async function GET(req: Request) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const supabase = getSupabaseAdmin();

  // We do these in parallel — small queries, no need to chain.
  const [
    { count: totalRoutes },
    { count: publishedRoutes },
    { count: pendingRoutes },
    { count: failedRoutes },
    { count: liveRoutes },
    { count: totalAirports },
    { data: byWaveRaw },
    { data: recent },
  ] = await Promise.all([
    supabase.from('routes').select('id', { count: 'exact', head: true }),
    supabase.from('routes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('routes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('routes').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('release_wave', env.currentReleaseWave),
    supabase.from('airports').select('iata', { count: 'exact', head: true }),
    // Per-wave breakdown — group by release_wave.
    supabase.from('routes').select('release_wave'),
    supabase
      .from('routes')
      .select('origin_iata,destination_iata,slug,published_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  const byWave: StatusByWave[] = [];
  if (byWaveRaw) {
    const counts = new Map<number, number>();
    for (const row of byWaveRaw as { release_wave: number }[]) {
      counts.set(row.release_wave, (counts.get(row.release_wave) ?? 0) + 1);
    }
    for (const [wave, count] of Array.from(counts.entries()).sort(([a], [b]) => a - b)) {
      byWave.push({ wave, count });
    }
  }

  return Response.json({
    currentReleaseWave: env.currentReleaseWave,
    routes: {
      total: totalRoutes ?? 0,
      published: publishedRoutes ?? 0,
      pending: pendingRoutes ?? 0,
      failed: failedRoutes ?? 0,
      liveInCurrentWave: liveRoutes ?? 0,
    },
    airports: { total: totalAirports ?? 0 },
    waves: byWave,
    recentlyPublished: recent ?? [],
    sitemapUrls: {
      index: `${env.siteUrl}/sitemap-index.xml`,
      static: `${env.siteUrl}/sitemap.xml`,
    },
  });
}
