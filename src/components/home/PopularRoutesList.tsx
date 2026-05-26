import Link from 'next/link';
import { buildRoutePath } from '@/lib/slug';
import { getPublishedSlugsForPairs } from '@/lib/queries';
import { WorldDotsBackground } from '@/components/home/WorldDotsBackground';

// Footer-ish text-link grid of high-intent routes. Important for SEO because
// every link feeds Googlebot the canonical URL of a route page. Internal
// linking density is one of the largest indexing-rate levers for programmatic
// SEO sites.
//
// This component is async + server-rendered. It takes a wishlist of pairs,
// asks Supabase which of those are actually published, and uses the DB's
// canonical slug (NOT a slug rebuilt from the friendly display name) so the
// generated /routes/<o>/<d>/<slug> URLs match what the route page expects.
// Pairs that aren't published yet are quietly skipped — no dead links.
//
// The display text uses the friendly city name from the wishlist (so "MAA"
// reads as "Chennai" even though the airports row says "Madras"), while the
// href uses the DB slug (so the route page resolves on first hop, no redirect).

interface RoutePair {
  o: { iata: string; cityName: string };
  d: { iata: string; cityName: string };
}

const DOMESTIC: RoutePair[] = [
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'bom', cityName: 'Mumbai' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'blr', cityName: 'Bangalore' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'goi', cityName: 'Goa' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'del', cityName: 'Delhi' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'goi', cityName: 'Goa' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'blr', cityName: 'Bangalore' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'del', cityName: 'Delhi' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'maa', cityName: 'Chennai' } },
  { o: { iata: 'maa', cityName: 'Chennai' },   d: { iata: 'del', cityName: 'Delhi' } },
  { o: { iata: 'maa', cityName: 'Chennai' },   d: { iata: 'bom', cityName: 'Mumbai' } },
  { o: { iata: 'ccu', cityName: 'Kolkata' },   d: { iata: 'del', cityName: 'Delhi' } },
  { o: { iata: 'hyd', cityName: 'Hyderabad' }, d: { iata: 'bom', cityName: 'Mumbai' } },

  // Fallback pool — used if any of the headline 12 aren't published yet, so
  // we always show ~12 working links. Each is also a high-intent India pair.
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'ccu', cityName: 'Kolkata' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'hyd', cityName: 'Hyderabad' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'maa', cityName: 'Chennai' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'pnq', cityName: 'Pune' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'amd', cityName: 'Ahmedabad' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'jai', cityName: 'Jaipur' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'hyd', cityName: 'Hyderabad' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'maa', cityName: 'Chennai' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'ccu', cityName: 'Kolkata' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'pnq', cityName: 'Pune' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'bom', cityName: 'Mumbai' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'hyd', cityName: 'Hyderabad' } },
];

const INTERNATIONAL: RoutePair[] = [
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'dxb', cityName: 'Dubai' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'sin', cityName: 'Singapore' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'bkk', cityName: 'Bangkok' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'lhr', cityName: 'London' } },
  { o: { iata: 'del', cityName: 'Delhi' },     d: { iata: 'jfk', cityName: 'New York' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'dxb', cityName: 'Dubai' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'sin', cityName: 'Singapore' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'lhr', cityName: 'London' } },
  { o: { iata: 'bom', cityName: 'Mumbai' },    d: { iata: 'cdg', cityName: 'Paris' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'sin', cityName: 'Singapore' } },
  { o: { iata: 'blr', cityName: 'Bangalore' }, d: { iata: 'dxb', cityName: 'Dubai' } },
  { o: { iata: 'maa', cityName: 'Chennai' },   d: { iata: 'sin', cityName: 'Singapore' } },
];

// Render up to `limit` working links from the wishlist. Pairs missing from
// Supabase (not published yet, wrong wave) are skipped. The link href uses
// the slug Supabase returned, so the route page resolves on first hop.
function LinkRow({
  pairs,
  slugMap,
  limit,
}: {
  pairs: RoutePair[];
  slugMap: Map<string, string>;
  limit: number;
}) {
  const live = pairs
    .map((p) => {
      const key = `${p.o.iata}-${p.d.iata}`;
      const slug = slugMap.get(key);
      return slug ? { ...p, slug } : null;
    })
    .filter((x): x is RoutePair & { slug: string } => x !== null)
    .slice(0, limit);

  if (live.length === 0) {
    return (
      <p className="text-sm text-fg-muted italic">
        No routes published in this section yet — check back soon.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
      {live.map((p) => {
        const href = buildRoutePath(p.o.iata, p.d.iata, p.slug);
        return (
          <li key={`${p.o.iata}-${p.d.iata}`}>
            <Link
              href={href}
              className="text-fg-muted transition hover:text-accent-bg"
            >
              {p.o.cityName} to {p.d.cityName} flights
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export async function PopularRoutesList() {
  // Combine both wishlists into a single DB query — saves a round-trip.
  const allPairs = [...DOMESTIC, ...INTERNATIONAL].map((p) => ({
    origin: p.o.iata,
    destination: p.d.iata,
  }));
  const slugMap = await getPublishedSlugsForPairs(allPairs);

  return (
    <section className="relative overflow-hidden border-t border-border-token bg-bg py-12">
      <WorldDotsBackground className="absolute inset-0 z-0" opacity={0.08} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        <h2 className="mb-4 text-base font-bold uppercase tracking-widest text-fg">
          Popular domestic flight routes
        </h2>
        <LinkRow pairs={DOMESTIC} slugMap={slugMap} limit={12} />

        <h2 className="mt-10 mb-4 text-base font-bold uppercase tracking-widest text-fg">
          Popular international flight routes
        </h2>
        <LinkRow pairs={INTERNATIONAL} slugMap={slugMap} limit={12} />
      </div>
    </section>
  );
}
