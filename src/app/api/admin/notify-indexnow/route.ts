import { getSupabaseAdmin } from '@/lib/supabase';
import { env } from '@/lib/env';
import { buildRoutePath } from '@/lib/slug';
import { submitToIndexNow } from '@/lib/indexnow';
import { requireAdmin } from '@/lib/admin-auth';

// POST /api/admin/notify-indexnow
//
// Body: { mode: 'recent' | 'wave', limit?: number, wave?: number }
//
//   mode='recent'  — push routes published in the last N hours (default 24)
//   mode='wave'    — push every route in a given release_wave (use when you
//                    bump CURRENT_RELEASE_WAVE — tells Bing/Yandex about the
//                    new batch in one call)
//
// Headers: Authorization: Bearer <ADMIN_TOKEN>
//
// Returns: { submitted, status, message }

export const runtime = 'nodejs';

interface Body {
  mode?: 'recent' | 'wave';
  limit?: number;
  wave?: number;
  hours?: number;
}

export async function POST(req: Request) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body: Body = await req.json().catch(() => ({}));
  const mode = body.mode ?? 'recent';

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('routes')
    .select('origin_iata,destination_iata,slug')
    .eq('status', 'published')
    .limit(body.limit ?? 10_000);

  if (mode === 'wave') {
    if (typeof body.wave !== 'number') {
      return Response.json({ error: 'wave required for mode=wave' }, { status: 400 });
    }
    query = query.eq('release_wave', body.wave);
  } else {
    // 'recent' — by default, the last 24 hours
    const hours = body.hours ?? 24;
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    query = query.gte('published_at', since);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const urls = (data ?? []).map(
    (r) => `${env.siteUrl}${buildRoutePath(r.origin_iata, r.destination_iata, r.slug)}`
  );

  const result = await submitToIndexNow(urls);
  return Response.json({ urls: urls.length, ...result });
}
