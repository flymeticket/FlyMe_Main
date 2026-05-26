import type { AirportRow, RouteRow } from '@/lib/database.types';

const BRAND_BLUE = '#1B1FE3';

function formatDuration(min: number | null): string {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function RouteHeader({
  origin,
  destination,
  route,
}: {
  origin: AirportRow;
  destination: AirportRow;
  route: RouteRow;
}) {
  return (
    <header className="border-b border-border-token pb-10">
      <p
        className="text-xs font-bold uppercase tracking-[0.3em]"
        style={{ color: BRAND_BLUE }}
      >
        Flights from {origin.country} to {destination.country}
      </p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-6xl">
        {origin.city} to {destination.city}
      </h1>
      <p className="mt-2 text-lg text-fg-muted">
        {origin.name} ({origin.iata.toUpperCase()}) →{' '}
        {destination.name} ({destination.iata.toUpperCase()})
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-y-6 text-sm md:grid-cols-4">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-fg-muted">Distance</dt>
          <dd className="mt-1 text-base font-bold text-fg">
            {route.distance_km ? `${route.distance_km.toLocaleString()} km` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-fg-muted">Typical duration</dt>
          <dd className="mt-1 text-base font-bold text-fg">{formatDuration(route.typical_duration_min)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-fg-muted">Airlines</dt>
          <dd className="mt-1 text-base font-bold text-fg">
            {route.airlines && route.airlines.length > 0
              ? `${route.airlines.length} carriers`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-fg-muted">From</dt>
          <dd className="mt-1 text-base font-bold text-fg">{origin.timezone ?? '—'}</dd>
        </div>
      </dl>
    </header>
  );
}
