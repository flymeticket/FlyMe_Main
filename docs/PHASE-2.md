# Phase 2 — Content Generation

Auto-generates SEO content for every route in the DB via GPT-4o-mini. Each
route gets: meta title + description, hero markdown, route history with
H2 subheadings, 6-8 FAQs (first two with the "cheap flights" SEO keyword
baked in), distance + duration estimates.

## Components

| File | Purpose |
|---|---|
| `src/lib/content-generator.ts` | The generator. Builds the prompt, calls OpenAI in JSON mode, validates with zod, writes back to Supabase, logs to `generation_jobs`. |
| `scripts/generate-content.ts` | Standalone batch worker. Concurrent (default 5), resumable, country-filterable. |
| `src/app/api/admin/generate-route/route.ts` | On-demand HTTP endpoint. Single route or small batch. Gated by `ADMIN_TOKEN`. |
| `scripts/seed-openflights.ts` | (Updated) Now also inserts every ordered pair of Indian airports with service → ~4,970 routes. |

## Prerequisites

Five env vars in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…           # bypasses RLS, used by seed + worker
OPENAI_API_KEY=sk-…
OPENAI_MODEL=gpt-4o-mini              # optional, defaults to this
ADMIN_TOKEN=<long random string>      # required for the admin endpoint
```

Schema must be applied:

```
supabase/migrations/0001_init.sql      airports, routes, generation_jobs
supabase/migrations/0002_indexing.sql  release_wave, published_at, triggers
```

## End-to-end run (India launch)

```bash
# 1. Seed airports + real routes + India permutations (~10 min on a slow link)
npm run seed

# 2. Smoke test — generate content for 10 Indian routes (~$0.01)
npm run generate:india:test

# 3. Eyeball a couple of the generated rows in Supabase — sanity-check the
#    tone, that the "cheap flights" keyword landed in FAQ #1 and #2, etc.

# 4. Run the full Indian batch (~4,970 routes, ~$5, ~25 min at concurrency=5)
npm run generate:india

# 5. Bump the wave gate to publish (already at 1 by default — only required
#    if you uploaded them at a higher release_wave)
#    CURRENT_RELEASE_WAVE=1 in .env.local

# 6. Submit /sitemap-index.xml to Google Search Console + Bing Webmaster
```

## CLI flags (`scripts/generate-content.ts`)

| Flag | Default | Effect |
|---|---|---|
| `--limit=N` | all | Stop after N routes |
| `--concurrency=N` | 5 | Parallel OpenAI requests (max 20) |
| `--country=India` | none | Only routes where BOTH endpoints are in this country |
| `--retry-failed` | false | Also re-attempt rows where `status='failed'` |
| `--milestone=N` | 1000 | Print + write status file every N completed routes |

## Monitoring

Every `--milestone` completed routes (default 1000) the worker prints a
fat summary block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MILESTONE — 1,000 / 4,970 processed in this run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  This run:    998 ok · 2 failed
  AI credits:  $1.124 spent  (avg $0.0011 per page)
  DB pages:    1,381 routes published across the whole DB
  Rate:        2.85 routes/sec
  ETA:         1,393s (23.2 min) for 3,970 remaining
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

…and writes the same payload to **`scripts/data/generation-status.json`**
so external tools (dashboards, Slack bots) can `tail -f` or poll it:

```json
{
  "updatedAt": "2026-05-21T17:42:13.401Z",
  "doneThisRun": 1000,
  "failedThisRun": 2,
  "queueSizeThisRun": 4970,
  "costUsdThisRun": 1.124,
  "avgCostPerPage": 0.00112,
  "totalPublishedAllTime": 1381,
  "elapsedSec": 350
}
```

## OpenAI credit exhaustion

If OpenAI returns an `insufficient_quota` / billing error mid-run the
worker stops immediately with a clear message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠  OPENAI CREDITS EXHAUSTED — worker halted
     Top up at https://platform.openai.com/account/billing
     Then re-run the same command; rows already 'published' will be skipped.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Exit code **2** (so wrapper scripts can detect and trigger a Slack ping
or whatever). All in-flight rows still finish or are marked `'failed'`
before exit. Re-running picks up where it stopped because rows already
flipped to `'published'` are skipped.

Errors that aren't credit-related (random network blip, malformed JSON
from one specific route) just mark **that row** as `'failed'` and the
worker keeps going.

## Admin endpoint

```bash
# Generate one specific route
curl -X POST http://localhost:3003/api/admin/generate-route \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"single","origin":"bom","destination":"goi"}'

# Generate a batch (max 100 per call due to 5-min function timeout)
curl -X POST http://localhost:3003/api/admin/generate-route \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"batch","limit":50,"country":"India"}'
```

Response shape:

```json
{
  "ok": true,
  "count": 50,
  "totalCostUsd": 0.062,
  "results": [
    { "origin": "bom", "destination": "del", "ok": true, "costUsd": 0.0012 },
    { "origin": "bom", "destination": "blr", "ok": true, "costUsd": 0.0011 },
    …
  ]
}
```

## What the generator produces

For each route, GPT-4o-mini returns JSON matching the zod schema in
`content-generator.ts`:

```ts
{
  meta_title: "Cheap Flights from Mumbai to Goa (BOM → GOI) · FlyMyTicket",
  meta_description: "Find cheap flights from Mumbai to Goa from ₹2,200…",
  hero_md: "Mumbai to Goa is one of India's most-flown leisure corridors…",
  history_md: "## Commercial origins\n\nThe Mumbai-Goa route…",
  faqs: [
    { q: "How do I find cheap flights from Mumbai to Goa?", a: "…" },
    { q: "What is the cheapest flight from Mumbai to Goa?",  a: "…" },
    …6 more
  ],
  distance_km: 433,
  typical_duration_min: 65
}
```

The first two FAQs always carry the keywords "cheap flights from X to Y"
and "cheapest flight from X to Y" verbatim in both question AND answer —
the prompt enforces this. Same with the meta description.

## Resumability

Every route has a `status` column: `pending` → `generating` → `published`
or `failed`. The batch worker only picks `pending` rows (and `failed` if
`--retry-failed` is passed). Kill the worker any time and re-run — it
picks up where it left off because rows already flipped to `published`
are skipped.

The `generation_jobs` table logs every attempt (success or failure) with
token count and cost, so you can audit spend later:

```sql
select sum(cost_usd) as total_cost, count(*) as attempts
from generation_jobs
where created_at >= now() - interval '24 hours';
```

## Cost guard-rails

* gpt-4o-mini pricing as of 2026-05: **$0.15 / 1M input tokens, $0.60 / 1M output tokens**
* Average per route: ~700 input + ~1,400 output = **~$0.001**
* India scope (4,970 routes): **~$5 one-time**
* Worldwide scope (37,594 routes): **~$40 one-time**
* Full theoretical (36.9M): ~$40,000 — don't do this

The worker prints running total `$0.XXX` after every route so you can
abort if it spikes.

## What to do if a route fails

`status='failed'` rows have their error message in `generation_jobs.error`.
Common causes:

* OpenAI rate limit → re-run with `--retry-failed` and lower `--concurrency`
* zod validation fail (model returned malformed JSON) → re-run with `--retry-failed`, usually self-heals on retry
* Airport row missing from DB → re-run `npm run seed`

## When you're ready to expand beyond India

```bash
# Pull every pending route worldwide (no country filter)
npm run generate

# Or use the admin endpoint with batch mode and no country filter
```

Then bump `CURRENT_RELEASE_WAVE` in `.env.local` from 1 → 2 → … on each
publish wave per `docs/INDEXING.md`. Pages with `release_wave > current`
stay hidden from sitemaps + return 404 until you unlock them.
