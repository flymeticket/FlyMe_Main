import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { countLiveAirports, getLiveAirportsPage } from '@/lib/queries';

// Chunked sitemap for airport hub pages — same pattern as routes/sitemap.ts
// but typically only 1 chunk since we have ~7K airports.

const CHUNK_SIZE = 45_000;

export async function generateSitemaps() {
  const total = await countLiveAirports();
  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

// `revalidate` not allowed alongside generateSitemaps — see routes/sitemap.ts.

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const offset = id * CHUNK_SIZE;
  const rows = await getLiveAirportsPage(offset, CHUNK_SIZE);

  return rows.map((a) => ({
    url: `${env.siteUrl}/airports/${a.iata}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
}
