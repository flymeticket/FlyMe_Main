import type { Metadata } from 'next';
import type { AirportRow } from '@/lib/database.types';
import { HeroBanner } from '@/components/home/HeroBanner';
import { HeroVideo } from '@/components/home/HeroVideo';
import { OffersBanner } from '@/components/home/OffersBanner';
import {
  PopularDestinations,
  type PopularDestination,
  type OriginOption,
} from '@/components/home/PopularDestinations';
import { WhyHeritage } from '@/components/home/WhyHeritage';
import { PopularRoutesList } from '@/components/home/PopularRoutesList';

export const metadata: Metadata = {
  title: 'FlyMyTicket — Compare flights, hotels and cars worldwide',
  description:
    'Search and compare millions of cheap flights, hotels and car hire across 500+ travel partners. One simple search.',
};

// ─── Stand-in airport rows for the hero search widget ────────────────────
const NOW = new Date().toISOString();
const stubAirport = (
  iata: string,
  name: string,
  city: string,
  country: string,
): AirportRow => ({
  iata,
  icao: null,
  name,
  city,
  country,
  country_code: null,
  lat: null,
  lng: null,
  timezone: null,
  terminals: null,
  history_md: null,
  local_travel_md: null,
  about_md: null,
  generated_at: null,
  content_version: 1,
  release_wave: 1,
  published_at: NOW,
  created_at: NOW,
  updated_at: NOW,
});

const DEL = stubAirport('del', 'Indira Gandhi International Airport', 'Delhi', 'India');
const BOM = stubAirport('bom', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India');

// ─── Origin options for the destination rails ───────────────────────────
const DOMESTIC_ORIGINS: OriginOption[] = [
  { iata: 'del', cityName: 'Delhi' },
  { iata: 'bom', cityName: 'Mumbai' },
  { iata: 'blr', cityName: 'Bangalore' },
  { iata: 'maa', cityName: 'Chennai' },
  { iata: 'hyd', cityName: 'Hyderabad' },
  { iata: 'ccu', cityName: 'Kolkata' },
];

// Prices are placeholders until the partner-pricing API lands. They're
// ordered descending by intuitive demand so the rail tells a coherent story.
const DOMESTIC_DESTINATIONS: PopularDestination[] = [
  { iata: 'bom', cityName: 'Mumbai',    priceFrom: '10,877' },
  { iata: 'blr', cityName: 'Bangalore', priceFrom: '13,482' },
  { iata: 'pnq', cityName: 'Pune',      priceFrom: '11,428' },
  { iata: 'ccu', cityName: 'Kolkata',   priceFrom: '8,998'  },
  { iata: 'hyd', cityName: 'Hyderabad', priceFrom: '9,799'  },
  { iata: 'goi', cityName: 'Goa',       priceFrom: '9,642'  },
  { iata: 'maa', cityName: 'Chennai',   priceFrom: '12,112' },
  { iata: 'amd', cityName: 'Ahmedabad', priceFrom: '8,242'  },
  { iata: 'jai', cityName: 'Jaipur',    priceFrom: '6,540'  },
  { iata: 'lko', cityName: 'Lucknow',   priceFrom: '7,120'  },
];

const INTERNATIONAL_DESTINATIONS: PopularDestination[] = [
  { iata: 'dxb', cityName: 'Dubai',     priceFrom: '14,210' },
  { iata: 'sin', cityName: 'Singapore', priceFrom: '18,840' },
  { iata: 'bkk', cityName: 'Bangkok',   priceFrom: '12,470' },
  { iata: 'lhr', cityName: 'London',    priceFrom: '38,990' },
  { iata: 'jfk', cityName: 'New York',  priceFrom: '62,150' },
  { iata: 'nrt', cityName: 'Tokyo',     priceFrom: '34,520' },
  { iata: 'cdg', cityName: 'Paris',     priceFrom: '41,840' },
  { iata: 'syd', cityName: 'Sydney',    priceFrom: '54,260' },
  { iata: 'hkg', cityName: 'Hong Kong', priceFrom: '22,400' },
  { iata: 'kul', cityName: 'Kuala Lumpur', priceFrom: '16,800' },
];

// Region cards — coarser geography for users who haven't decided on a city.
// `href` points to a future region landing page (`/destinations/<slug>`).
// imageSeed nudges picsum toward a stable region-specific photo.
const REGION_DESTINATIONS: PopularDestination[] = [
  { iata: 'asia',        cityName: 'Asia',                 priceFrom: '13,603', href: '/destinations/asia',         imageSeed: 'mount-fuji' },
  { iata: 'top',         cityName: 'Top Destinations',     priceFrom: '15,433', href: '/destinations/top',          imageSeed: 'london-bridge' },
  { iata: 'middle-east', cityName: 'Middle East',          priceFrom: '21,836', href: '/destinations/middle-east',  imageSeed: 'burj-khalifa' },
  { iata: 'europe',      cityName: 'Europe',               priceFrom: '24,112', href: '/destinations/europe',       imageSeed: 'tallinn' },
  { iata: 'africa',      cityName: 'Africa',               priceFrom: '34,230', href: '/destinations/africa',       imageSeed: 'savanna' },
  { iata: 'oceania',     cityName: 'Australia & Oceania',  priceFrom: '56,163', href: '/destinations/oceania',      imageSeed: 'queenstown' },
  { iata: 'americas',    cityName: 'Americas',             priceFrom: '48,920', href: '/destinations/americas',     imageSeed: 'nyc-skyline' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero photo carousel — six destinations crossfade every 5s. Sets
          the "wanderlust" tone before the functional search widget below. */}
      <HeroBanner />

      {/* Search widget on its own white block, sitting cleanly below the
          carousel (no overlap). */}
      <HeroVideo defaultOrigin={DEL} defaultDestination={BOM} />

      <OffersBanner />

      <PopularDestinations
        title="Flights to Popular Domestic Destinations from"
        origins={DOMESTIC_ORIGINS}
        destinations={DOMESTIC_DESTINATIONS}
      />

      <PopularDestinations
        title="Flights to Popular International Destinations from"
        origins={DOMESTIC_ORIGINS}
        destinations={INTERNATIONAL_DESTINATIONS}
      />

      <PopularDestinations
        title="Explore by Region from"
        origins={DOMESTIC_ORIGINS}
        destinations={REGION_DESTINATIONS}
      />

      <WhyHeritage />
      <PopularRoutesList />
      {/* Footer is rendered globally by the (content) layout — no per-page footer here. */}
    </>
  );
}
