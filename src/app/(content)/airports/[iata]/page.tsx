import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAirport, getOtherRoutesFromOrigin } from '@/lib/queries';
import { env } from '@/lib/env';
import { buildRoutePath } from '@/lib/slug';
import { Markdown } from '@/components/flights/Markdown';
import Link from 'next/link';

export const revalidate = 86400;
export const dynamicParams = true;

// Airport pages are individually small; we don't pre-render any at build time
// in v1. Add a list of top airports here when we have traffic data.
export async function generateStaticParams() {
  return [];
}

type Props = PageProps<'/airports/[iata]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { iata } = await params;
  const airport = await getAirport(iata);
  if (!airport) return { title: 'Airport not found · FlyMyTicket' };

  const title = `${airport.name} (${airport.iata.toUpperCase()}) · ${airport.city} Airport Guide`;
  const description = `Terminals, transport options and direct flights from ${airport.name} (${airport.iata.toUpperCase()}) in ${airport.city}, ${airport.country}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${env.siteUrl}/airports/${airport.iata}`,
    },
    openGraph: { title, description },
  };
}

export default async function AirportPage({ params }: Props) {
  const { iata } = await params;
  const airport = await getAirport(iata);
  if (!airport) notFound();

  const outboundRoutes = await getOtherRoutesFromOrigin(airport.iata, '___none___', 24);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <nav className="mb-6 text-xs uppercase tracking-widest text-fg-muted">
        <a href="/" className="hover:text-fg">Home</a> / Airports /{' '}
        {airport.iata.toUpperCase()}
      </nav>

      <header className="border-b border-border-token pb-10">
        <p
          className="text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: '#1B1FE3' }}
        >
          {airport.country} · Airport guide
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-6xl">
          {airport.name}
        </h1>
        <p className="mt-2 text-lg text-fg-muted">
          {airport.city}, {airport.country} · {airport.iata.toUpperCase()}
          {airport.icao ? ` / ${airport.icao}` : ''}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-y-6 text-sm md:grid-cols-4">
          <div>
            <dt className="text-fg-muted">Timezone</dt>
            <dd className="mt-1 text-fg">{airport.timezone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Coordinates</dt>
            <dd className="mt-1 text-fg">
              {airport.lat != null && airport.lng != null
                ? `${airport.lat.toFixed(2)}, ${airport.lng.toFixed(2)}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Direct destinations</dt>
            <dd className="mt-1 text-fg">{outboundRoutes.length}+</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Country</dt>
            <dd className="mt-1 text-fg">{airport.country}</dd>
          </div>
        </dl>
      </header>

      {airport.about_md && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-fg">About {airport.name}</h2>
          <Markdown source={airport.about_md} />
        </section>
      )}

      {airport.history_md && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-fg">History</h2>
          <Markdown source={airport.history_md} />
        </section>
      )}

      {airport.local_travel_md && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-fg">Getting to and from the airport</h2>
          <Markdown source={airport.local_travel_md} />
        </section>
      )}

      {outboundRoutes.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            Direct flights from {airport.city}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {outboundRoutes.map(({ route, destination }) => (
              <li key={route.id}>
                <Link
                  href={buildRoutePath(route.origin_iata, route.destination_iata, route.slug)}
                  className="block rounded-lg border border-border-token p-4 transition hover:border-border-strong hover:bg-bg-soft"
                >
                  <p className="text-sm uppercase tracking-widest text-fg-muted">
                    → {route.destination_iata.toUpperCase()}
                  </p>
                  <p className="mt-1 text-lg font-bold text-fg">
                    {airport.city} to {destination.city}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">{destination.country}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
