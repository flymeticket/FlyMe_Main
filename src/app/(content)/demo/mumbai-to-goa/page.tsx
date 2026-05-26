// Static demo page using the same components as /routes/[o]/[d]/[slug].
// Content here mirrors the structure that the Phase-2 OpenAI worker will
// generate for every route in the database. Useful for visual review before
// the DB and worker are wired up.
//
// Once Supabase is seeded and content is generated, the canonical URL for
// this route is /routes/bom/goi/mumbai-to-goa — this /demo page can be
// removed.

import type { Metadata } from 'next';
import type {
  AirportRow,
  RouteRow,
  RouteFaq,
} from '@/lib/database.types';
import { RouteHeader } from '@/components/flights/RouteHeader';
import { BookingCTA } from '@/components/flights/BookingCTA';
import { Markdown } from '@/components/flights/Markdown';
import { FAQs, FAQSchema } from '@/components/flights/FAQs';
import { OtherFlights } from '@/components/flights/OtherFlights';
import { FlightSearchWidget } from '@/components/flights/FlightSearchWidget';

export const metadata: Metadata = {
  title: 'Flights from Mumbai to Goa (BOM → GOI) — Demo',
  description:
    'Sample of an auto-generated route page: Mumbai to Goa flight info, airline list, brief history, airport guides, and FAQs.',
  robots: { index: false, follow: false }, // demo only — keep out of search
};

// ─── Demo data ───────────────────────────────────────────────────────────
const NOW = new Date().toISOString();

const bom: AirportRow = {
  iata: 'bom',
  icao: 'VABB',
  name: 'Chhatrapati Shivaji Maharaj International Airport',
  city: 'Mumbai',
  country: 'India',
  country_code: 'in',
  lat: 19.0887,
  lng: 72.8679,
  timezone: 'Asia/Kolkata',
  terminals: [
    { name: 'T1', use: 'Domestic' },
    { name: 'T2', use: 'International + select domestic' },
  ],
  about_md: [
    'Chhatrapati Shivaji Maharaj International Airport is India\'s second-busiest airport, handling around **50 million passengers a year**. It operates two terminals on a single runway crossover — Terminal 1 for most domestic carriers in Santacruz, and the showpiece Terminal 2 in Sahar, which serves all international flights and some premium domestic routes.',
    '',
    'Terminal 2 is best known for the **Jaya He museum wall** — a 3-kilometre permanent installation of over 5,000 traditional and contemporary Indian artworks, woven into the architecture of the building.',
  ].join('\n'),
  history_md: [
    'The airport began life as **Santa Cruz Airport** in 1942, built by the Royal Air Force during the Second World War. After Indian independence, civil aviation took over, and the site was renamed Sahar International Airport in 1981.',
    '',
    'In 1999 the entire complex was renamed in honour of the Maratha king Chhatrapati Shivaji. The current Terminal 2, designed by Skidmore, Owings & Merrill, opened in **February 2014** and consolidated international and premium domestic operations under one roof.',
  ].join('\n'),
  local_travel_md: [
    '- **Metro Line 1** connects Andheri to the airport area; nearest station is *Airport Road* (1.5 km from T1, free shuttle).',
    '- **Prepaid taxi** counters at both terminals — expect ₹400–₹700 to South Mumbai, ₹250–₹400 to Bandra/Andheri.',
    '- **Uber and Ola** pickup is at the dedicated app-based cab zone; surge is common during peak hours.',
    '- **BEST bus** services run frequently to Andheri, Bandra and Dadar at ₹20–₹40.',
    '- **Distance to city centre (Nariman Point):** ~30 km, 60–90 minutes in traffic.',
  ].join('\n'),
  generated_at: NOW,
  content_version: 1,
  release_wave: 1,
  published_at: NOW,
  created_at: NOW,
  updated_at: NOW,
};

const goi: AirportRow = {
  iata: 'goi',
  icao: 'VOGO',
  name: 'Goa International Airport (Dabolim)',
  city: 'Goa',
  country: 'India',
  country_code: 'in',
  lat: 15.3808,
  lng: 73.8314,
  timezone: 'Asia/Kolkata',
  terminals: [{ name: 'Civil Enclave', use: 'Domestic + International' }],
  about_md: [
    'Dabolim is one of two airports serving Goa, sharing its single runway with **INS Hansa**, the Indian Navy\'s premier air base. The civil enclave handles most flights to South and Central Goa — Panjim, Margao, Vasco, Colva, and Palolem.',
    '',
    'The newer **Manohar International Airport (Mopa, GOX)** opened in 2022 and serves North Goa. Most legacy routes including Mumbai still operate primarily through Dabolim.',
  ].join('\n'),
  history_md: [
    'Dabolim was originally a **Portuguese-built airfield**, completed in 1955 during the final years of Estado da Índia rule. After Goa\'s integration with India in 1961, the field was taken over by the Indian Navy.',
    '',
    'Civilian flights began in **1983** under a shared-use agreement that continues today — making Dabolim one of only a handful of Indian airports operating as a joint civil-military facility.',
  ].join('\n'),
  local_travel_md: [
    '- **Prepaid taxi** booths inside the arrivals hall — fixed fares posted: ₹750 to Panjim, ₹900 to Calangute, ₹1,200 to Anjuna.',
    '- **No Uber or Ola** — Goa\'s taxi unions block app-based ride-hailing. Use the prepaid counter or pre-arrange with your hotel.',
    '- **Goa Miles** is the state-licensed ride-hail app, but availability is patchy.',
    '- **Self-drive scooter and car rentals** are widely available in arrivals; expect ₹400–₹600/day for a scooter.',
    '- **Distance:** Panjim 30 km · Margao 25 km · Calangute 40 km · Palolem 70 km.',
  ].join('\n'),
  generated_at: NOW,
  content_version: 1,
  release_wave: 1,
  published_at: NOW,
  created_at: NOW,
  updated_at: NOW,
};

const route: RouteRow = {
  id: 'demo-bom-goi',
  origin_iata: 'bom',
  destination_iata: 'goi',
  slug: 'mumbai-to-goa',
  distance_km: 433,
  typical_duration_min: 65,
  airlines: ['6E', 'SG', 'AI', 'UK', 'QP'], // IndiGo, SpiceJet, Air India, Vistara, Akasa
  hero_md: [
    'Mumbai to Goa is one of India\'s most-flown leisure corridors. Around **30+ daily flights** in each direction connect Chhatrapati Shivaji Maharaj International (BOM) with Goa Dabolim (GOI), with five carriers competing on the route — typical fares range from **₹2,200 in low season to ₹6,000+ during Christmas and New Year**.',
    '',
    'A direct flight covers the 433 km in **~65 minutes**, roughly half the time of the comfortable but ten-hour Konkan Railway journey via the Konkan coast.',
  ].join('\n'),
  history_md: [
    'Commercial flights between Mumbai (then Bombay) and Goa began in the **late 1960s** under Indian Airlines, soon after Goa\'s integration with India. For the first two decades the route was thin — a handful of flights a week using HS-748 turboprops.',
    '',
    '## The package-tourism boom',
    '',
    'The route\'s explosive growth came with Goa\'s emergence as a charter destination in the 1980s and 1990s. International package operators routed travellers via Mumbai, and domestic airlines added capacity to feed the connection. By the early 2000s, daily frequencies had passed twenty.',
    '',
    '## Low-cost takeover',
    '',
    'The launch of **Air Deccan** (2003) and later **IndiGo** and **SpiceJet** transformed Mumbai-Goa into a price-sensitive, weekend-leisure route. Today low-cost carriers operate the majority of frequencies, and same-day return tickets under ₹4,000 are common outside peak season.',
  ].join('\n'),
  faqs: [
    // Lead with the "cheap flights" search-intent question — this is the
    // highest-volume query for the route. Then "cheapest flight" as a
    // sibling question. Both keywords appear in the answer body too, so
    // search engines pick them up in both the FAQ schema and the rich
    // results snippet.
    {
      q: 'How do I find cheap flights from Mumbai to Goa?',
      a: 'Cheap flights from Mumbai to Goa show up most often on IndiGo and SpiceJet — fares start around ₹2,200 in low season. Book mid-week, 4–6 weeks ahead, and use FlyMyTicket to compare cheap flight prices across all five carriers at once.',
    },
    {
      q: 'What is the cheapest flight from Mumbai to Goa right now?',
      a: 'The cheapest flight from Mumbai to Goa is usually a 1-hour direct hop on IndiGo or SpiceJet at around ₹2,200 in shoulder season. Prices spike to ₹6,000+ over Christmas, New Year, and Diwali — book early for those windows.',
    },
    {
      q: 'How long is a flight from Mumbai to Goa?',
      a: 'A direct flight from Mumbai (BOM) to Goa (GOI) takes about 1 hour 5 minutes. Including taxi, takeoff and landing, plan for about 1 hour 20 minutes block-to-block.',
    },
    {
      q: 'Which airlines fly from Mumbai to Goa?',
      a: 'Five carriers operate the route: IndiGo, SpiceJet, Air India, Vistara, and Akasa Air. IndiGo has the highest frequency with around 12 daily departures.',
    },
    {
      q: 'What is the cheapest day to fly from Mumbai to Goa?',
      a: 'Tuesdays and Wednesdays are typically cheapest, often 20–30% below weekend prices. Avoid Friday evenings and Sunday returns when leisure travellers push prices up.',
    },
    {
      q: 'How far in advance should I book a Mumbai to Goa flight?',
      a: 'For best fares, book 4–6 weeks ahead. During peak season (mid-December to early January, and major long weekends) fares climb steeply within two weeks of departure.',
    },
    {
      q: 'Should I fly to Dabolim (GOI) or Mopa (GOX)?',
      a: 'Dabolim is closer to South and Central Goa (Panjim, Vasco, Colva, Palolem). Mopa, opened in 2022, is closer to North Goa (Anjuna, Vagator, Morjim). Choose based on where you\'re staying — taxi fares between the two airports run ₹2,000+.',
    },
    {
      q: 'Are there direct flights, or do I need to connect?',
      a: 'All scheduled flights between Mumbai and Goa are direct. A connection through Bangalore or Hyderabad would typically only happen on a heavily-disrupted day with cancellations.',
    },
    {
      q: 'What is the baggage allowance on Mumbai-Goa flights?',
      a: 'Domestic carriers in India allow 15 kg checked baggage and 7 kg cabin on the lowest fares. Vistara and Air India full-service tickets typically include 25 kg checked.',
    },
    {
      q: 'Is the Mumbai to Goa flight a smooth ride?',
      a: 'Generally yes — it\'s a short coastal hop. During the southwest monsoon (June to September) afternoon flights can encounter moderate turbulence over the Western Ghats.',
    },
  ] as RouteFaq[],
  meta_title: 'Cheap Flights from Mumbai to Goa (BOM → GOI) — Compare Fares · FlyMyTicket',
  meta_description:
    'Find cheap flights from Mumbai to Goa from ₹2,200. Compare the cheapest flight prices across IndiGo, SpiceJet, Air India, Vistara and Akasa — 30+ daily departures, 1 hr 5 min.',
  status: 'published',
  generated_at: NOW,
  content_version: 1,
  release_wave: 1,
  published_at: NOW,
  created_at: NOW,
  updated_at: NOW,
};

// "Other flights from Mumbai" — minimal AirportRow stubs are enough; the
// component only reads city / country / iata.
function destStub(
  iata: string,
  city: string,
  country: string
): AirportRow {
  return {
    iata,
    icao: null,
    name: '',
    city,
    country,
    country_code: null,
    lat: null,
    lng: null,
    timezone: null,
    terminals: null,
    about_md: null,
    history_md: null,
    local_travel_md: null,
    generated_at: null,
    content_version: 1,
    release_wave: 1,
    published_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  };
}

function routeStub(
  origin: string,
  destinationIata: string,
  slug: string
): RouteRow {
  return {
    id: `demo-${origin}-${destinationIata}`,
    origin_iata: origin,
    destination_iata: destinationIata,
    slug,
    distance_km: null,
    typical_duration_min: null,
    airlines: null,
    hero_md: null,
    history_md: null,
    faqs: null,
    meta_title: null,
    meta_description: null,
    status: 'published',
    generated_at: NOW,
    content_version: 1,
    release_wave: 1,
    published_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  };
}

const otherRoutes = [
  { route: routeStub('bom', 'del', 'mumbai-to-delhi'),       destination: destStub('del', 'Delhi', 'India') },
  { route: routeStub('bom', 'blr', 'mumbai-to-bangalore'),   destination: destStub('blr', 'Bangalore', 'India') },
  { route: routeStub('bom', 'maa', 'mumbai-to-chennai'),     destination: destStub('maa', 'Chennai', 'India') },
  { route: routeStub('bom', 'ccu', 'mumbai-to-kolkata'),     destination: destStub('ccu', 'Kolkata', 'India') },
  { route: routeStub('bom', 'hyd', 'mumbai-to-hyderabad'),   destination: destStub('hyd', 'Hyderabad', 'India') },
  { route: routeStub('bom', 'dxb', 'mumbai-to-dubai'),       destination: destStub('dxb', 'Dubai', 'United Arab Emirates') },
  { route: routeStub('bom', 'sin', 'mumbai-to-singapore'),   destination: destStub('sin', 'Singapore', 'Singapore') },
  { route: routeStub('bom', 'lhr', 'mumbai-to-london'),      destination: destStub('lhr', 'London', 'United Kingdom') },
];

export default function DemoPage() {
  const faqs = route.faqs as RouteFaq[];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <nav className="mb-6 text-xs uppercase tracking-widest text-fg-muted">
          <a href="/" className="hover:text-fg">Home</a> / Demo / BOM → GOI
        </nav>

        <FlightSearchWidget origin={bom} destination={goi} tone="light" />

        <div
          className="mt-10 mb-10 inline-block rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{
            borderColor: '#A039F0',          // brand purple
            background: 'rgba(160,57,240,0.08)',
            color: '#7B26C2',
          }}
        >
          Demo · sample of auto-generated content
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <RouteHeader origin={bom} destination={goi} route={route} />

            <section className="mt-10">
              <Markdown source={route.hero_md!} />
            </section>

            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight text-fg">Brief history of this route</h2>
              <div className="mt-2">
                <Markdown source={route.history_md!} />
              </div>
            </section>

            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight text-fg">About the airports</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <AirportCard label="Departure" airport={bom} />
                <AirportCard label="Arrival" airport={goi} />
              </div>
            </section>

            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight text-fg">Getting to and from the airports</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-fg-muted">
                    Mumbai (BOM)
                  </h3>
                  <Markdown source={bom.local_travel_md!} />
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-fg-muted">
                    Goa (GOI)
                  </h3>
                  <Markdown source={goi.local_travel_md!} />
                </div>
              </div>
            </section>

            <FAQs faqs={faqs} />

            <OtherFlights origin={bom} routes={otherRoutes} />
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <BookingCTA origin={bom} destination={goi} route={route} />
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
  airport: AirportRow;
}) {
  return (
    <div className="rounded-lg border border-border-token p-5">
      <p className="text-xs uppercase tracking-widest text-fg-muted">{label}</p>
      <p className="mt-2 text-lg font-light text-fg">{airport.name}</p>
      <p className="text-sm text-fg-muted">
        {airport.city}, {airport.country} · {airport.iata.toUpperCase()}
      </p>
      {airport.about_md && (
        <div className="mt-3 text-sm">
          <Markdown source={airport.about_md} />
        </div>
      )}
      {airport.history_md && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-fg-muted hover:text-fg">
            History →
          </summary>
          <Markdown source={airport.history_md} />
        </details>
      )}
    </div>
  );
}
