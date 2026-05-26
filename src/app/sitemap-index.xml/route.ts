import { env } from '@/lib/env';
import { countLiveRoutes, countLiveAirports } from '@/lib/queries';

// Proper <sitemapindex> document — the single URL we submit to Google Search
// Console and Bing Webmaster Tools. It points at:
//   • /sitemap.xml                      (static pages)
//   • /routes/sitemap/[0..N-1].xml      (chunked route pages, 45K/chunk)
//   • /airports/sitemap/[0..M-1].xml    (chunked airport pages)
//
// Search engines crawl this index, then fetch each child sitemap in parallel.
// This is the standard mega-site pattern documented by Google.

const CHUNK = 45_000;

// Next.js requires segment config exports to be literal values, not variable
// references — see https://nextjs.org/docs/messages/invalid-segment-export.
export const revalidate = 3600;

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const base = env.siteUrl;
  const now = new Date().toISOString();

  const [routeCount, airportCount] = await Promise.all([
    countLiveRoutes(),
    countLiveAirports(),
  ]);
  const routeChunks   = Math.max(1, Math.ceil(routeCount   / CHUNK));
  const airportChunks = Math.max(1, Math.ceil(airportCount / CHUNK));

  const entries: string[] = [];
  entries.push(`<sitemap><loc>${xmlEscape(`${base}/sitemap.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`);

  for (let i = 0; i < routeChunks; i++) {
    entries.push(
      `<sitemap><loc>${xmlEscape(`${base}/routes/sitemap/${i}.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`
    );
  }
  for (let i = 0; i < airportChunks; i++) {
    entries.push(
      `<sitemap><loc>${xmlEscape(`${base}/airports/sitemap/${i}.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`
    );
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</sitemapindex>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=3600, stale-while-revalidate=86400`,
    },
  });
}
