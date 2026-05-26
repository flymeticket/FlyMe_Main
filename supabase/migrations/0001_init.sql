-- ─── Heritage Flights · routes platform · initial schema ──────────────
-- Run with: supabase db push   (after `supabase link`)
-- Or paste into Supabase SQL editor for first-time setup.
--
-- Conventions:
--   • IATA codes are stored LOWERCASE everywhere (matches Skyscanner URLs)
--   • Markdown content lives in *_md columns; FAQs are JSONB
--   • Status enum drives the generation pipeline state machine

-- ───────── Enums ─────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'generation_status') then
    create type generation_status as enum ('pending', 'generating', 'published', 'failed');
  end if;
end$$;

-- ───────── airports ─────────
create table if not exists airports (
  iata          text primary key check (iata = lower(iata) and length(iata) = 3),
  icao          text,
  name          text not null,
  city          text not null,
  country       text not null,
  country_code  text,                                  -- ISO-3166 alpha-2, lowercase
  lat           double precision,
  lng           double precision,
  timezone      text,
  terminals     jsonb,                                 -- [{ "name": "T2", "airlines": [...] }]
  history_md    text,
  local_travel_md text,
  about_md      text,
  generated_at  timestamptz,
  content_version integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists airports_city_idx    on airports (city);
create index if not exists airports_country_idx on airports (country_code);

-- ───────── routes ─────────
create table if not exists routes (
  id                    uuid primary key default gen_random_uuid(),
  origin_iata           text not null references airports(iata) on delete cascade,
  destination_iata      text not null references airports(iata) on delete cascade,
  slug                  text not null,                 -- e.g. "mumbai-to-goa"
  distance_km           integer,
  typical_duration_min  integer,
  airlines              text[],                        -- IATA airline codes serving this route
  hero_md               text,
  history_md            text,
  faqs                  jsonb,                         -- [{ "q": "...", "a": "..." }, ...]
  meta_title            text,
  meta_description      text,
  status                generation_status not null default 'pending',
  generated_at          timestamptz,
  content_version       integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint routes_pair_unique unique (origin_iata, destination_iata),
  constraint routes_no_self check (origin_iata <> destination_iata)
);

create index if not exists routes_origin_idx      on routes (origin_iata);
create index if not exists routes_destination_idx on routes (destination_iata);
create index if not exists routes_status_idx      on routes (status);
create index if not exists routes_slug_idx        on routes (slug);

-- ───────── generation_jobs ─────────
-- Append-only log of generation attempts. Useful for retries, cost tracking,
-- and debugging stuck rows.
create table if not exists generation_jobs (
  id            uuid primary key default gen_random_uuid(),
  route_id      uuid references routes(id) on delete cascade,
  airport_iata  text references airports(iata) on delete cascade,
  status        generation_status not null,
  error         text,
  tokens_used   integer,
  cost_usd      numeric(10, 6),
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  constraint job_target_check check (
    (route_id is not null and airport_iata is null) or
    (route_id is null and airport_iata is not null)
  )
);

create index if not exists jobs_route_idx   on generation_jobs (route_id);
create index if not exists jobs_airport_idx on generation_jobs (airport_iata);
create index if not exists jobs_status_idx  on generation_jobs (status);

-- ───────── updated_at trigger ─────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_airports_updated on airports;
create trigger trg_airports_updated before update on airports
  for each row execute function set_updated_at();

drop trigger if exists trg_routes_updated on routes;
create trigger trg_routes_updated before update on routes
  for each row execute function set_updated_at();

-- ───────── RLS ─────────
-- Enable RLS but allow anon read of published content only. Mutations
-- happen via the service-role key (seed + worker), which bypasses RLS.
alter table airports         enable row level security;
alter table routes           enable row level security;
alter table generation_jobs  enable row level security;

drop policy if exists "anon read airports"  on airports;
create policy "anon read airports" on airports
  for select using (true);

drop policy if exists "anon read published routes" on routes;
create policy "anon read published routes" on routes
  for select using (status = 'published');
