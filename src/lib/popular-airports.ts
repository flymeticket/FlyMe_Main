import type { AirportRow } from './database.types';

// Hand-picked top ~80 airports used by the home-page search widget for
// instant autocomplete without a DB round trip. Order roughly by global
// passenger volume; India-focused first since that's the primary market.
//
// When the full DB is wired up we'll swap this for a /api/airports/search
// endpoint that hits Supabase with a trigram match. Until then, this static
// list covers the routes 95% of homepage users will search.

const NOW = new Date().toISOString();

function a(
  iata: string,
  name: string,
  city: string,
  country: string,
  countryCode: string | null = null,
): AirportRow {
  return {
    iata,
    icao: null,
    name,
    city,
    country,
    country_code: countryCode,
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
  };
}

export const POPULAR_AIRPORTS: AirportRow[] = [
  // ─── India ──────────────────────────────────────────────────
  a('del', 'Indira Gandhi International Airport', 'Delhi',     'India', 'in'),
  a('bom', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'in'),
  a('blr', 'Kempegowda International Airport',   'Bangalore', 'India', 'in'),
  a('maa', 'Chennai International Airport',       'Chennai',   'India', 'in'),
  a('hyd', 'Rajiv Gandhi International Airport',  'Hyderabad', 'India', 'in'),
  a('ccu', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India', 'in'),
  a('goi', 'Goa International Airport (Dabolim)', 'Goa',       'India', 'in'),
  a('gox', 'Manohar International Airport (Mopa)','Goa',       'India', 'in'),
  a('amd', 'Sardar Vallabhbhai Patel International Airport',   'Ahmedabad','India','in'),
  a('pnq', 'Pune International Airport',          'Pune',      'India', 'in'),
  a('jai', 'Jaipur International Airport',        'Jaipur',    'India', 'in'),
  a('lko', 'Chaudhary Charan Singh International Airport',     'Lucknow', 'India', 'in'),
  a('cok', 'Cochin International Airport',        'Kochi',     'India', 'in'),
  a('trv', 'Trivandrum International Airport',    'Thiruvananthapuram', 'India', 'in'),
  a('ixc', 'Chandigarh International Airport',    'Chandigarh','India', 'in'),
  a('ixb', 'Bagdogra International Airport',      'Siliguri',  'India', 'in'),
  a('gau', 'Lokpriya Gopinath Bordoloi International Airport', 'Guwahati', 'India', 'in'),
  a('bbi', 'Biju Patnaik International Airport',  'Bhubaneswar','India','in'),
  a('nag', 'Dr. Babasaheb Ambedkar International Airport',     'Nagpur',  'India', 'in'),
  a('vns', 'Lal Bahadur Shastri International Airport',        'Varanasi','India', 'in'),

  // ─── Asia (ex-India) ────────────────────────────────────────
  a('dxb', 'Dubai International Airport',           'Dubai',      'United Arab Emirates', 'ae'),
  a('auh', 'Abu Dhabi International Airport',       'Abu Dhabi',  'United Arab Emirates', 'ae'),
  a('doh', 'Hamad International Airport',           'Doha',       'Qatar', 'qa'),
  a('sin', 'Singapore Changi Airport',              'Singapore',  'Singapore', 'sg'),
  a('bkk', 'Suvarnabhumi Airport',                  'Bangkok',    'Thailand', 'th'),
  a('dmk', 'Don Mueang International Airport',      'Bangkok',    'Thailand', 'th'),
  a('hkt', 'Phuket International Airport',          'Phuket',     'Thailand', 'th'),
  a('kul', 'Kuala Lumpur International Airport',    'Kuala Lumpur','Malaysia','my'),
  a('cgk', 'Soekarno–Hatta International Airport',  'Jakarta',    'Indonesia','id'),
  a('dps', 'Ngurah Rai International Airport',      'Bali',       'Indonesia','id'),
  a('mnl', 'Ninoy Aquino International Airport',    'Manila',     'Philippines','ph'),
  a('hkg', 'Hong Kong International Airport',       'Hong Kong',  'China', 'hk'),
  a('pek', 'Beijing Capital International Airport', 'Beijing',    'China', 'cn'),
  a('pvg', 'Shanghai Pudong International Airport', 'Shanghai',   'China', 'cn'),
  a('nrt', 'Narita International Airport',          'Tokyo',      'Japan', 'jp'),
  a('hnd', 'Haneda Airport',                        'Tokyo',      'Japan', 'jp'),
  a('icn', 'Incheon International Airport',         'Seoul',      'South Korea', 'kr'),
  a('cmb', 'Bandaranaike International Airport',    'Colombo',    'Sri Lanka', 'lk'),
  a('ktm', 'Tribhuvan International Airport',       'Kathmandu',  'Nepal', 'np'),
  a('dac', 'Hazrat Shahjalal International Airport','Dhaka',      'Bangladesh','bd'),

  // ─── Europe ─────────────────────────────────────────────────
  a('lhr', 'London Heathrow Airport',           'London',     'United Kingdom', 'gb'),
  a('lgw', 'London Gatwick Airport',            'London',     'United Kingdom', 'gb'),
  a('cdg', 'Charles de Gaulle Airport',         'Paris',      'France', 'fr'),
  a('ory', 'Paris Orly Airport',                'Paris',      'France', 'fr'),
  a('fra', 'Frankfurt Airport',                 'Frankfurt',  'Germany', 'de'),
  a('muc', 'Munich Airport',                    'Munich',     'Germany', 'de'),
  a('ams', 'Amsterdam Schiphol Airport',        'Amsterdam',  'Netherlands', 'nl'),
  a('mad', 'Adolfo Suárez Madrid–Barajas Airport','Madrid',  'Spain', 'es'),
  a('bcn', 'Barcelona–El Prat Airport',         'Barcelona',  'Spain', 'es'),
  a('fco', 'Leonardo da Vinci–Fiumicino Airport','Rome',     'Italy', 'it'),
  a('mxp', 'Milan Malpensa Airport',            'Milan',      'Italy', 'it'),
  a('zrh', 'Zurich Airport',                    'Zurich',     'Switzerland', 'ch'),
  a('vie', 'Vienna International Airport',      'Vienna',     'Austria', 'at'),
  a('cph', 'Copenhagen Airport',                'Copenhagen', 'Denmark', 'dk'),
  a('arn', 'Stockholm Arlanda Airport',         'Stockholm',  'Sweden', 'se'),
  a('ist', 'Istanbul Airport',                  'Istanbul',   'Turkey', 'tr'),
  a('ath', 'Athens International Airport',      'Athens',     'Greece', 'gr'),
  a('lis', 'Lisbon Humberto Delgado Airport',   'Lisbon',     'Portugal', 'pt'),

  // ─── Americas ───────────────────────────────────────────────
  a('jfk', 'John F. Kennedy International Airport','New York', 'United States', 'us'),
  a('ewr', 'Newark Liberty International Airport','Newark',   'United States', 'us'),
  a('lax', 'Los Angeles International Airport',  'Los Angeles','United States', 'us'),
  a('sfo', 'San Francisco International Airport','San Francisco','United States','us'),
  a('ord', 'O\'Hare International Airport',      'Chicago',   'United States', 'us'),
  a('mia', 'Miami International Airport',        'Miami',     'United States', 'us'),
  a('iad', 'Washington Dulles International Airport','Washington','United States','us'),
  a('bos', 'Boston Logan International Airport', 'Boston',    'United States', 'us'),
  a('atl', 'Hartsfield–Jackson Atlanta International Airport','Atlanta','United States','us'),
  a('yyz', 'Toronto Pearson International Airport','Toronto', 'Canada', 'ca'),
  a('yvr', 'Vancouver International Airport',    'Vancouver', 'Canada', 'ca'),
  a('mex', 'Mexico City International Airport',  'Mexico City','Mexico','mx'),
  a('gru', 'São Paulo–Guarulhos International Airport','São Paulo','Brazil','br'),

  // ─── Oceania ────────────────────────────────────────────────
  a('syd', 'Kingsford Smith Airport',           'Sydney',     'Australia', 'au'),
  a('mel', 'Melbourne Airport',                 'Melbourne',  'Australia', 'au'),
  a('akl', 'Auckland Airport',                  'Auckland',   'New Zealand', 'nz'),
  a('nan', 'Nadi International Airport',        'Nadi',       'Fiji', 'fj'),

  // ─── Africa ─────────────────────────────────────────────────
  a('jnb', 'O. R. Tambo International Airport', 'Johannesburg','South Africa','za'),
  a('cpt', 'Cape Town International Airport',   'Cape Town',  'South Africa','za'),
  a('cai', 'Cairo International Airport',       'Cairo',      'Egypt', 'eg'),
  a('nbo', 'Jomo Kenyatta International Airport','Nairobi',  'Kenya', 'ke'),
  a('rak', 'Marrakesh Menara Airport',          'Marrakesh',  'Morocco','ma'),
];

// Helper: format an airport for display in the input.
export function formatAirportLabel(a: AirportRow): string {
  return `${a.city} (${a.iata.toUpperCase()})`;
}

// Helper: given the freeform string the user typed, find the best matching
// airport. We try (in order):
//   1. exact "(IATA)" suffix match
//   2. exact city match (case-insensitive)
//   3. prefix match on city
//   4. prefix match on IATA
// Returns null if nothing in the popular list resembles the query.
export function findAirport(query: string): AirportRow | null {
  if (!query) return null;
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // (XXX) suffix
  const m = trimmed.match(/\(([A-Za-z]{3})\)/);
  if (m) {
    const iata = m[1].toLowerCase();
    const hit = POPULAR_AIRPORTS.find((a) => a.iata === iata);
    if (hit) return hit;
  }

  const byCity = POPULAR_AIRPORTS.find((a) => a.city.toLowerCase() === lower);
  if (byCity) return byCity;

  const byCityPrefix = POPULAR_AIRPORTS.find((a) =>
    a.city.toLowerCase().startsWith(lower),
  );
  if (byCityPrefix) return byCityPrefix;

  const byIataPrefix = POPULAR_AIRPORTS.find((a) =>
    a.iata.startsWith(lower),
  );
  if (byIataPrefix) return byIataPrefix;

  return null;
}
