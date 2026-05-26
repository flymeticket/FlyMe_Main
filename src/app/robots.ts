import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

// robots.txt — explicit allow + disallow rules to keep crawl budget focused
// on indexable content. Points search engines at the sitemap-index, which
// is the entry point for the chunked sitemaps.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't waste crawl budget on the IndexNow key file, admin APIs,
        // Next.js internals, or coming-soon surfaces that don't need to rank.
        disallow: [
          '/api/',
          '/i/',
          '/_next/',
          '/admin',
          // Demo URLs are noindex via metadata, but disallow keeps them off
          // crawl queues entirely.
          '/demo/',
        ],
      },
      // Block known scrapers / SEO bot spam that don't return real traffic
      // but do eat crawl budget on each server.
      { userAgent: 'AhrefsBot',   disallow: '/' },
      { userAgent: 'SemrushBot',  disallow: '/' },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
    ],
    sitemap: `${env.siteUrl}/sitemap-index.xml`,
    host: env.siteUrl,
  };
}
