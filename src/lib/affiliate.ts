import { env } from './env';

// Skyscanner deep-link builder. We append the associate ID so all bookings
// originating from our pages are credited to our affiliate account.
//
// Reference URL pattern (from user-provided sample):
//   https://www.skyscanner.co.in/routes/bom/igoi/mumbai-to-goa.html
//   ?associateID=...&utm_source=flymyticket
//
// Note: Skyscanner uses lowercased IATA codes. The destination prefix `i` in
// some of their URLs is a market/currency hint we don't replicate — our links
// go to the canonical .com domain so users see local currency via redirect.

interface RouteLinkArgs {
  originIata: string;
  destinationIata: string;
  slug: string;        // e.g. 'mumbai-to-goa'
  market?: string;     // 'co.in', 'com', 'co.uk', etc — defaults to .com
}

export function buildSkyscannerRouteUrl({
  originIata,
  destinationIata,
  slug,
  market = 'com',
}: RouteLinkArgs): string {
  const o = originIata.toLowerCase();
  const d = destinationIata.toLowerCase();
  const url = new URL(`https://www.skyscanner.${market}/routes/${o}/${d}/${slug}.html`);
  if (env.skyscannerAssociateId) {
    url.searchParams.set('associateID', env.skyscannerAssociateId);
  }
  url.searchParams.set('utm_source', 'flymyticket');
  url.searchParams.set('utm_medium', 'referral');
  return url.toString();
}

// Skyscanner search URL — used by the FlightSearchWidget on submit.
//
// URL format (verified against live Skyscanner pages):
//   /transport/flights/{orig}/{dest}/{YYMMDD}/[YYMMDD]/
//   ?adults=1&cabinclass=economy&preferdirects=false&rtn=1
//
// `dates` are local YYYY-MM-DD strings; we convert to YYMMDD for the URL.
// Omitting both dates yields a flexible search; omitting `returnDate` does
// a one-way search (still pass `rtn=0`).

export type CabinClass = 'economy' | 'premiumeconomy' | 'business' | 'first';

interface SearchLinkArgs {
  originIata: string;
  destinationIata: string;
  departDate?: string;        // 'YYYY-MM-DD'
  returnDate?: string;        // 'YYYY-MM-DD' or undefined for one-way
  adults?: number;            // default 1
  children?: number;          // default 0
  infants?: number;           // default 0
  cabin?: CabinClass;         // default 'economy'
  directOnly?: boolean;       // default false
  market?: string;            // default 'com'
}

function toYYMMDD(iso: string): string {
  // 'YYYY-MM-DD' -> 'YYMMDD'
  return iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
}

export function buildSkyscannerSearchUrl({
  originIata,
  destinationIata,
  departDate,
  returnDate,
  adults = 1,
  children = 0,
  infants = 0,
  cabin = 'economy',
  directOnly = false,
  market = 'com',
}: SearchLinkArgs): string {
  const o = originIata.toLowerCase();
  const d = destinationIata.toLowerCase();
  const isReturn = Boolean(returnDate);

  // Path segments — Skyscanner accepts /<orig>/<dest>/[depart]/[return]/
  const segments: string[] = ['transport', 'flights', o, d];
  if (departDate) {
    segments.push(toYYMMDD(departDate));
    if (returnDate) segments.push(toYYMMDD(returnDate));
  }

  const url = new URL(
    `https://www.skyscanner.${market}/${segments.join('/')}/`
  );

  url.searchParams.set('adults', String(adults));
  if (children > 0) url.searchParams.set('children', String(children));
  if (infants > 0) url.searchParams.set('infants', String(infants));
  url.searchParams.set('cabinclass', cabin);
  url.searchParams.set('rtn', isReturn ? '1' : '0');
  url.searchParams.set('preferdirects', directOnly ? 'true' : 'false');

  if (env.skyscannerAssociateId) {
    url.searchParams.set('associateID', env.skyscannerAssociateId);
  }
  url.searchParams.set('utm_source', 'flymyticket');
  url.searchParams.set('utm_medium', 'referral');
  return url.toString();
}
