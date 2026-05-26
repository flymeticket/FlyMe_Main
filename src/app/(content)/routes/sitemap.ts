import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { countLiveRoutes, getLiveRoutesPage } from '@/lib/queries';
import { buildRoutePath } from '@/lib/slug';

// Chunked sitemap for route pages. Google enforces 50,000 URLs per file —
// Next.js 16's generateSitemaps() fans this segment out into N chunks served
// at /routes/sitemap/[id].xml. The root /sitemap.xml is a sitemap-index that
// references each chunk plus the airports sitemap and the homepage.

const CHUNK_SIZE = 45_000; // safety margin under Google's 50K hard cap

export async function generateSitemaps() {
  const total = await countLiveRoutes();
  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  // Always return at least one chunk so the path resolves cleanly with 0 rows.
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

// Note: when combined with generateSitemaps(), `export const revalidate`
// isn't honored on the parent — Next.js treats each generated chunk as its
// own route. We rely on cache headers + on-demand revalidate via the
// content-generation worker instead.

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const offset = id * CHUNK_SIZE;
  const rows = await getLiveRoutesPage(offset, CHUNK_SIZE);

  return rows.map((r) => ({
    url: `${env.siteUrl}${buildRoutePath(r.origin_iata, r.destination_iata, r.slug)}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
}
