-- ─── Heritage Flights · indexing engine · phased publishing ──────────
-- Adds two columns to support phased release of programmatic SEO pages.
-- Run after 0001_init.sql. Idempotent — uses IF NOT EXISTS.
--
-- Semantics:
--   release_wave  = the publishing wave this row belongs to (1, 2, 3, …)
--   published_at  = timestamp when the row first became eligible for serving
--
-- A row is served as a real 200 + included in the sitemap when:
--   status = 'published' AND release_wave <= app.current_release_wave
--
-- The app reads CURRENT_RELEASE_WAVE from env at request time and bumps it
-- forward weekly via a config change — no DB write needed for a wave release.

alter table routes
  add column if not exists release_wave integer not null default 1,
  add column if not exists published_at timestamptz;

alter table airports
  add column if not exists release_wave integer not null default 1,
  add column if not exists published_at timestamptz;

create index if not exists routes_release_wave_idx   on routes   (release_wave);
create index if not exists airports_release_wave_idx on airports (release_wave);

-- When status flips to 'published', stamp published_at automatically.
create or replace function set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (old.status is null or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end$$;

drop trigger if exists trg_routes_published_at on routes;
create trigger trg_routes_published_at before update on routes
  for each row execute function set_published_at();

drop trigger if exists trg_routes_published_at_ins on routes;
create trigger trg_routes_published_at_ins before insert on routes
  for each row execute function set_published_at();
