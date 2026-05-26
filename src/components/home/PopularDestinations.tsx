'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { buildRouteSlug, buildRoutePath } from '@/lib/slug';
import { WorldDotsBackground } from '@/components/home/WorldDotsBackground';

// Yatra-style "Popular destinations" rail. White card containing:
//   • Title bar — trip-type pill + headline + origin-city dropdown + chevron
//   • Horizontal scroll of full-image destination cards (city name top-left,
//     "Starting from / ₹X,XXX" bottom-left, dark gradient overlay)
//   • "See all the locations →" footer link
//
// Used twice on the home page — once for domestic, once for international.
// The origin dropdown re-routes the cards' hrefs but the displayed cities and
// prices stay the same in v1 (no per-origin price feed yet).

export interface PopularDestination {
  iata: string;            // 3-letter for cities; arbitrary slug for regions
  cityName: string;        // e.g. "Mumbai" — or a region label like "Middle East"
  priceFrom: string;       // formatted, e.g. "10,877"
  // Optional overrides — used by the regions rail.
  href?: string;           // skip buildRoutePath, link straight here
  imageSeed?: string;      // override the picsum seed (defaults to iata)
}

export interface OriginOption {
  iata: string;          // 3-letter, lowercase
  cityName: string;      // e.g. "Delhi"
}

interface Props {
  title: string;                  // e.g. "Flights to Popular Domestic Destinations from"
  origins: OriginOption[];        // dropdown options
  destinations: PopularDestination[];
  seeAllHref?: string;
}

export function PopularDestinations({
  title,
  origins,
  destinations,
  seeAllHref = '#',
}: Props) {
  const [originIata, setOriginIata] = useState(origins[0]?.iata ?? 'del');
  const origin = origins.find((o) => o.iata === originIata) ?? origins[0];
  const railRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: 'left' | 'right') {
    const el = railRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8 * (direction === 'right' ? 1 : -1);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <section className="relative overflow-hidden">
      <WorldDotsBackground className="absolute inset-0 z-0" opacity={0.08} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 md:px-10">
      <div className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border-token/60 md:p-7">
        {/* Title bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Trip-type pill — static for now; the real trip toggle lives in
              the hero widget. Kept here for visual parity with the mock. */}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-bg">
            Return
            <Chevron />
          </span>

          <h2 className="text-base font-medium text-fg md:text-lg">
            {title}
          </h2>

          {/* Origin city dropdown — fully styled so it doesn't render as a
              system <select>. Native dropdown still opens on click. */}
          <span className="relative inline-flex items-center gap-1.5 text-sm font-medium text-accent-bg">
            {origin?.cityName ?? 'Delhi'}
            <Chevron />
            <select
              aria-label="Origin city"
              value={originIata}
              onChange={(e) => setOriginIata(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {origins.map((o) => (
                <option key={o.iata} value={o.iata}>
                  {o.cityName}
                </option>
              ))}
            </select>
          </span>

          {/* Right chevron — scrolls the rail forward */}
          <button
            type="button"
            onClick={() => scrollRail('right')}
            aria-label="Scroll right"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-token bg-white text-fg-muted transition hover:border-border-strong hover:text-fg"
          >
            <ArrowRight />
          </button>
        </div>

        {/* Card rail */}
        <div
          ref={railRef}
          className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pl-2 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {destinations.map((d) => {
            // Region cards pass a literal `href` (e.g. /destinations/asia).
            // City cards omit it and we synthesise /routes/<o>/<d>/<slug>.
            const href =
              d.href ??
              buildRoutePath(
                originIata,
                d.iata,
                buildRouteSlug(origin?.cityName ?? 'Delhi', d.cityName),
              );
            const img = `https://picsum.photos/seed/${d.imageSeed ?? d.iata}-city/400/520`;
            return (
              <Link
                key={d.iata}
                href={href}
                className="group relative block aspect-[3/4] w-[160px] shrink-0 snap-start overflow-hidden rounded-xl ring-1 ring-border-token/40 transition hover:ring-border-strong md:w-[180px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={d.cityName}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {/* Strong bottom gradient so the price reads on any photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
                <p className="absolute left-3 right-3 top-3 text-base font-bold text-white drop-shadow md:text-lg">
                  {d.cityName}
                </p>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-[10px] uppercase tracking-wide text-white/70">
                    Starting from
                  </p>
                  <p className="text-base font-bold leading-tight md:text-lg">
                    ₹{d.priceFrom}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer link */}
        <div className="mt-5 flex justify-center">
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-bg hover:underline"
          >
            See all the locations
            <ArrowUpRight />
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}

// ─── tiny inline icons ───────────────────────────────────────────────────
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function ArrowUpRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
