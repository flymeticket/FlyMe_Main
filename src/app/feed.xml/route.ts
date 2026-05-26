import { env } from '@/lib/env';
import { getSupabasePublic } from '@/lib/supabase';
import { buildRoutePath } from '@/lib/slug';

// RSS 2.0 feed of the most recently published route guides.
// Use cases:
//   1. Push to PubSubHubbub / Superfeedr → real-time discovery signal
//   2. Subscribers (humans + AI crawlers like Perplexity) follow new content
//   3. Some search engines crawl RSS feeds preferentially over sitemaps
//
// We expose the latest 50 published routes; older content lives in sitemaps.

export const revalidate = 1800; // 30 min

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const base = env.siteUrl;
  const now = new Date().toUTCString();

  const items: string[] = [];

  if (env.supabaseUrl && env.supabaseAnonKey) {
    const supabase = getSupabasePublic();
    const { data } = await supabase
      .from('routes')
      .select('origin_iata,destination_iata,slug,meta_title,meta_description,published_at')
      .eq('status', 'published')
      .lte('release_wave', env.currentReleaseWave)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(50);

    for (const r of data ?? []) {
      const url = `${base}${buildRoutePath(r.origin_iata, r.destination_iata, r.slug)}`;
      const title = r.meta_title ?? `${r.origin_iata.toUpperCase()} → ${r.destination_iata.toUpperCase()}`;
      const desc  = r.meta_description ?? '';
      const pub   = r.published_at ? new Date(r.published_at).toUTCString() : now;
      items.push(
        `<item>` +
          `<title>${xmlEscape(title)}</title>` +
          `<link>${xmlEscape(url)}</link>` +
          `<guid isPermaLink="true">${xmlEscape(url)}</guid>` +
          `<description>${xmlEscape(desc)}</description>` +
          `<pubDate>${pub}</pubDate>` +
        `</item>`
      );
    }
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0">\n' +
    '<channel>\n' +
    `<title>FlyMyTicket — new routes</title>\n` +
    `<link>${xmlEscape(base)}</link>\n` +
    `<description>Latest flight route guides published on FlyMyTicket.</description>\n` +
    `<language>en</language>\n` +
    `<lastBuildDate>${now}</lastBuildDate>\n` +
    items.join('\n') + '\n' +
    '</channel>\n</rss>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
