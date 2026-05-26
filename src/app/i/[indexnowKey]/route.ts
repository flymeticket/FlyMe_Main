import { notFound } from 'next/navigation';
import { env } from '@/lib/env';

// IndexNow ownership verification file, served at /i/{key}.txt.
// We declare this custom keyLocation in every IndexNow POST so search
// engines fetch it here instead of the site root — keeps the root URL
// space clean of catch-all dynamic segments.
//
// Cache-Control header in the response handles edge caching; we don't use
// `force-static` because dynamic-segment route handlers need generateStaticParams
// to be statically generated, and the key isn't known at build time.

type Props = RouteContext<'/i/[indexnowKey]'>;

export async function GET(_req: Request, { params }: Props) {
  const { indexnowKey } = await params;
  const key = env.indexNowKey;
  if (!key || indexnowKey !== `${key}.txt`) notFound();

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
