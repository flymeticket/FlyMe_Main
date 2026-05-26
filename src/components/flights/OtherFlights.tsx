import Link from 'next/link';
import type { AirportRow, RouteRow } from '@/lib/database.types';
import { buildRoutePath } from '@/lib/slug';

// Internal-link grid — "Other flights from {origin}". Critical for crawl
// depth: every route page links 6–8 siblings, giving Googlebot a dense web
// to traverse and lifting the indexing rate of the whole network.
//
// White cards on the page bg, brand-blue eyebrow + thin blue left border,
// blue-tinted shadow + hover lift — matches the FlyMyTicket palette.

const BRAND_BLUE = '#1B1FE3';

const CARD_SHADOW =
  'shadow-[0_10px_20px_-10px_rgba(27,31,227,0.20),0_4px_8px_-2px_rgba(27,31,227,0.10)]';
const CARD_SHADOW_HOVER =
  'hover:shadow-[0_20px_40px_-15px_rgba(27,31,227,0.35),0_8px_16px_-4px_rgba(27,31,227,0.20)]';

export function OtherFlights({
  origin,
  routes,
}: {
  origin: AirportRow;
  routes: Array<{ route: RouteRow; destination: AirportRow }>;
}) {
  if (routes.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold tracking-tight text-fg">
        Other flights from {origin.city}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Popular onward connections from {origin.iata.toUpperCase()}.
      </p>
      {/* grid items stretch to row height by default; `h-full` on the inner
          Link makes the card fill its grid cell so every card in a row ends
          up the same height regardless of country-name length. */}
      <ul className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map(({ route, destination }) => (
          <li key={route.id} className="h-full">
            <Link
              href={buildRoutePath(route.origin_iata, route.destination_iata, route.slug)}
              className={`flex h-full flex-col rounded-xl border-l-4 bg-white p-5 transition ${CARD_SHADOW} ${CARD_SHADOW_HOVER} hover:-translate-y-0.5`}
              style={{ borderLeftColor: BRAND_BLUE }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: BRAND_BLUE }}
              >
                {route.origin_iata.toUpperCase()} → {route.destination_iata.toUpperCase()}
              </p>
              <p className="mt-2 text-lg font-bold leading-tight text-fg">
                {origin.city} to {destination.city}
              </p>
              <p className="mt-1 text-sm text-fg-muted">{destination.country}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
