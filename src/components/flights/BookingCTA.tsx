import Link from 'next/link';
import type { AirportRow, RouteRow } from '@/lib/database.types';
import { buildSkyscannerSearchUrl, buildSkyscannerRouteUrl } from '@/lib/affiliate';

// Sticky-sidebar "Book this route" card. Matches the FlyMyTicket brand:
// white card with a brand-blue header strip + brand-blue primary button.
// Skyscanner deep-link with our affiliate ID — no live prices until a
// partner-API integration ships.

const BRAND_BLUE = '#1B1FE3';
const BRAND_BLUE_DARK = '#1518C3';
const BRAND_PURPLE = '#A039F0';

const SHADOW =
  'shadow-[0_30px_60px_-15px_rgba(27,31,227,0.25),0_12px_24px_-6px_rgba(27,31,227,0.18)]';

export function BookingCTA({
  origin,
  destination,
  route,
}: {
  origin: AirportRow;
  destination: AirportRow;
  route: RouteRow;
}) {
  const searchUrl = buildSkyscannerSearchUrl({
    originIata: origin.iata,
    destinationIata: destination.iata,
  });
  const routeUrl = buildSkyscannerRouteUrl({
    originIata: origin.iata,
    destinationIata: destination.iata,
    slug: route.slug,
  });

  return (
    <aside className={`overflow-hidden rounded-xl bg-white ${SHADOW}`}>
      {/* Brand-blue header strip — matches the boarding pass header */}
      <div className="relative px-6 py-4 text-white" style={{ background: BRAND_BLUE }}>
        {/* Thin purple accent stripe at the top, mirrors the boarding pass */}
        <span
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: BRAND_PURPLE }}
          aria-hidden
        />
        <p className="text-xs font-bold uppercase tracking-[0.25em]">Book this route</p>
        <p className="mt-1.5 text-xl font-bold leading-tight">
          {origin.city} → {destination.city}
        </p>
        <p className="text-xs text-white/70">
          {origin.iata.toUpperCase()} → {destination.iata.toUpperCase()}
        </p>
      </div>

      <div className="px-6 pb-6 pt-5">
        <Link
          href={searchUrl}
          target="_blank"
          rel="sponsored noopener"
          className="block rounded-lg bg-[#1B1FE3] py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#1518C3]"
        >
          Compare prices
        </Link>
        <Link
          href={routeUrl}
          target="_blank"
          rel="sponsored noopener"
          className="mt-2 block rounded-lg border-2 border-[#1B1FE3] py-3 text-center text-sm font-semibold uppercase tracking-wide text-[#1B1FE3] transition hover:bg-[#1B1FE3]/5"
        >
          View deals on Skyscanner
        </Link>

        <p className="mt-4 text-xs text-fg-muted">
          We earn a commission when you book — at no extra cost to you.
        </p>
      </div>
    </aside>
  );
}
