// URL slug helpers. Skyscanner uses `mumbai-to-goa` style, lowercased,
// hyphens for spaces, ASCII-only. We mirror that.

export function slugifyCity(city: string): string {
  return city
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')      // strip combining marks (é → e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')          // collapse non-alnum runs into one hyphen
    .replace(/^-+|-+$/g, '');             // trim leading/trailing hyphens
}

export function buildRouteSlug(originCity: string, destinationCity: string): string {
  return `${slugifyCity(originCity)}-to-${slugifyCity(destinationCity)}`;
}

export function buildRoutePath(
  originIata: string,
  destinationIata: string,
  slug: string
): string {
  return `/routes/${originIata.toLowerCase()}/${destinationIata.toLowerCase()}/${slug}`;
}
