import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getRouteByPair, getOtherRoutesFromOrigin, getTopRoutesForBuild } from '@/lib/queries';
import { buildRoutePath } from '@/lib/slug';
import { env } from '@/lib/env';
import type { RouteFaq } from '@/lib/database.types';
import { RouteHeader } from '@/components/flights/RouteHeader';
import { BookingCTA } from '@/components/flights/BookingCTA';
import { Markdown } from '@/components/flights/Markdown';
import { FAQs, FAQSchema } from '@/components/flights/FAQs';
import { OtherFlights } from '@/components/flights/OtherFlights';
import { FlightSearchWidget } from '@/components/flights/FlightSearchWidget';

// Revalidate every 24h. Once a route is published, content rarely changes
// (history is immutable; airline lists shift slowly). On-demand revalidation
// from the generation worker can override this when a route is regenerated.
export const revalidate = 86400;

// Allow on-demand SSR for routes not in generateStaticParams. Skyscanner-style
// programmatic SEO needs all route pairs reachable; missing ones will render
// from DB on first request, then be cached.
export const dynamicParams = true;

// Pre-render the top routes at build time. Everything else generates on demand.
// We cap at a small number to keep build time reasonable; raise as the index grows.
export async function generateStaticParams() {
  const routes = await getTopRoutesForBuild(200);
  // Next.js 16 with cacheComponents requires at least one param; without it,
  // an empty array is fine. We're not using cacheComponents in v1.
  return routes.map((r) => ({
    origin: r.origin_iata,
    destination: r.destination_iata,
    slug: r.slug,
  }));
}

// Strongly typed via the global PageProps helper that Next.js 16 generates
// from the route literal during `next dev` / `next build`.
type Props = PageProps<'/routes/[origin]/[destination]/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { origin, destination, slug } = await params;
  const data = await getRouteByPair(origin, destination);
  if (!data) return { title: 'Route not found · FlyMyTicket' };

  const { route, origin: o, destination: d } = data;
  const title =
    route.meta_title ??
    `Flights from ${o.city} to ${d.city} (${o.iata.toUpperCase()} → ${d.iata.toUpperCase()})`;
  const description =
    route.meta_description ??
    `Compare flight prices, airlines, and travel times from ${o.city} (${o.iata.toUpperCase()}) to ${d.city} (${d.iata.toUpperCase()}).`;
  const canonical = `${env.siteUrl}${buildRoutePath(o.iata, d.iata, slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function RoutePage({ params }: Props) {
  const { origin, destination, slug } = await params;
  const data = await getRouteByPair(origin, destination);
  if (!data) notFound();

  const { route, origin: o, destination: d } = data;

  // Canonicalisation: if the URL slug doesn't match the canonical slug for
  // this route pair, redirect to the canonical one. Keeps duplicate URLs out
  // of Google's index.
  if (route.slug !== slug) {
    redirect(buildRoutePath(o.iata, d.iata, route.slug));
  }

  const otherRoutes = await getOtherRoutesFromOrigin(o.iata, d.iata, 8);
  const faqs = (route.faqs as RouteFaq[] | null) ?? [];

  // If content hasn't been generated yet, show a lightweight placeholder.
  // (The page still indexes fine; content backfills on revalidation.)
  const isPublished = route.status === 'published';

  return (
    <>
      <FAQSchema faqs={faqs} />
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <nav className="mb-6 text-xs uppercase tracking-widest text-fg-muted">
          <a href="/" className="hover:text-fg">Home</a> / Routes /{' '}
          {o.iata.toUpperCase()} → {d.iata.toUpperCase()}
        </nav>

        <FlightSearchWidget origin={o} destination={d} tone="light" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <RouteHeader origin={o} destination={d} route={route} />

            {!isPublished && (
              <p className="mt-10 rounded-lg border border-border-token bg-bg-soft p-5 text-sm text-fg-muted">
                Detailed route guide is being prepared. Booking is available now via the
                links on the right.
              </p>
            )}

            {route.hero_md && (
              <section className="mt-10">
                <Markdown source={route.hero_md} />
              </section>
            )}

            {route.history_md && (
              <section className="mt-16">
                <h2 className="text-2xl font-bold tracking-tight text-fg">Brief history of this route</h2>
                <div className="mt-2">
                  <Markdown source={route.history_md} />
                </div>
              </section>
            )}

            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight text-fg">About the airports</h2>

              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <AirportCard label="Departure" airport={o} />
                <AirportCard label="Arrival" airport={d} />
              </div>
            </section>

            <FAQs faqs={faqs} />

            <OtherFlights origin={o} routes={otherRoutes} />
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <BookingCTA origin={o} destination={d} route={route} />
          </div>
        </div>
      </main>
    </>
  );
}

function AirportCard({
  label,
  airport,
}: {
  label: string;
  airport: { iata: string; name: string; city: string; country: string; about_md: string | null };
}) {
  return (
    <div className="rounded-lg border border-border-token p-5">
      <p className="text-xs uppercase tracking-widest text-fg-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-fg">{airport.name}</p>
      <p className="text-sm text-fg-muted">
        {airport.city}, {airport.country} · {airport.iata.toUpperCase()}
      </p>
      {airport.about_md && (
        <div className="mt-3 text-sm">
          <Markdown source={airport.about_md} />
        </div>
      )}
      <a
        href={`/airports/${airport.iata}`}
        className="mt-4 inline-block text-xs uppercase tracking-widest text-fg-muted hover:text-fg"
      >
        Airport guide →
      </a>
    </div>
  );
}
