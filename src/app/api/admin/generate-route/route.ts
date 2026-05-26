import { getSupabaseAdmin } from '@/lib/supabase';
import { generateAndPersistRoute } from '@/lib/content-generator';
import { requireAdmin } from '@/lib/admin-auth';
import type { RouteRow } from '@/lib/database.types';

// POST /api/admin/generate-route
//
// On-demand Phase-2 content generation. Two modes:
//
//   { mode: 'single', origin: 'bom', destination: 'goi' }
//     → generate (or regenerate) one specific route
//
//   { mode: 'batch', limit: 50, country: 'India' }
//     → process up to N pending routes; optional country filter
//
// Headers: Authorization: Bearer <ADMIN_TOKEN>
//
// Returns: { ok, results: [{ origin, destination, ok, costUsd, error }], totalCostUsd }
//
// For the overnight batch (4,970 routes), use scripts/generate-content.ts
// instead — this endpoint is for ad-hoc regeneration from an admin tool.

export const runtime = 'nodejs';
export const maxDuration = 300;     // 5 min — enough for ~50 routes serial

interface Body {
  mode?: 'single' | 'batch';
  origin?: string;
  destination?: string;
  limit?: number;
  country?: string;
}

export async function POST(req: Request) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body: Body = await req.json().catch(() => ({}));
  const mode = body.mode ?? 'single';
  const supabase = getSupabaseAdmin();

  let routes: RouteRow[] = [];

  if (mode === 'single') {
    if (!body.origin || !body.destination) {
      return Response.json(
        { error: 'origin and destination required for mode=single' },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('origin_iata', body.origin.toLowerCase())
      .eq('destination_iata', body.destination.toLowerCase())
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: 'route not found' }, { status: 404 });
    routes = [data as RouteRow];
  } else {
    // Batch mode — pending only, optional country filter.
    let q = supabase
      .from('routes')
      .select('*')
      .eq('status', 'pending')
      .order('id')
      .limit(Math.min(body.limit ?? 25, 100));

    if (body.country) {
      const { data: airports } = await supabase
        .from('airports')
        .select('iata')
        .eq('country', body.country);
      const iatas = (airports ?? []).map((a) => a.iata);
      q = q.in('origin_iata', iatas).in('destination_iata', iatas);
    }

    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    routes = (data as RouteRow[]) ?? [];
  }

  // Serial — easier to reason about with a 5-minute function timeout.
  // For high throughput use the standalone scripts/generate-content.ts.
  const results = [];
  let totalCostUsd = 0;
  for (const route of routes) {
    const { ok, costUsd, error } = await generateAndPersistRoute(route);
    totalCostUsd += costUsd;
    results.push({
      origin: route.origin_iata,
      destination: route.destination_iata,
      ok,
      costUsd,
      error,
    });
  }

  return Response.json({ ok: true, results, totalCostUsd, count: results.length });
}
