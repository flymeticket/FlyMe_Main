import Link from 'next/link';
import { buildRouteSlug, buildRoutePath } from '@/lib/slug';

// Reusable destination card grid. Used twice on the home page — once for
// domestic, once for international. Cards link to the route page using
// the canonical IATA-pair URL the rest of the site uses.
//
// Images come from picsum.photos with a deterministic seed (city slug) so
// every render shows the same photo. Replace with curated destination
// imagery (Unsplash / Pexels) once a CMS pipeline is in place.

export interface Destination {
  cityName: string;       // display name, e.g. "Mumbai"
  countryName: string;    // e.g. "India"
  iata: string;           // 3-letter IATA, lowercase
  priceFrom: string;      // formatted display price e.g. "₹4,200"
}

interface Props {
  title: string;
  subtitle?: string;
  origin: { iata: string; cityName: string };
  destinations: Destination[];
}

export function DestinationGrid({
  title,
  subtitle,
  origin,
  destinations,
}: Props) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d) => {
          const slug = buildRouteSlug(origin.cityName, d.cityName);
          const href = buildRoutePath(origin.iata, d.iata, slug);
          // Picsum stable per-city image. 800x500 is the card aspect.
          const img = `https://picsum.photos/seed/${d.iata}/800/500`;
          return (
            <Link
              key={d.iata}
              href={href}
              className="group block overflow-hidden rounded-md border border-border-token bg-bg-soft transition hover:border-border-strong hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${d.cityName}, ${d.countryName}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-base font-bold leading-tight">
                    {d.cityName}
                  </p>
                  <p className="text-xs text-white/70">{d.countryName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-fg-muted">Starting from</p>
                <p className="text-base font-bold text-fg">{d.priceFrom}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
