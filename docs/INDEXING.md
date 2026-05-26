# Indexing strategy engine

Operational playbook for getting Heritage Flights' ~67K route pages + ~5K airport
pages indexed by Google, Bing, and the other engines that matter.

## Mental model

Two independent levers — **what's live** and **what search engines know about**.

```
                ┌─────────────┐
                │   routes    │  ← all rows in DB (e.g. 67K)
                └──────┬──────┘
                       │ status='published'  (set by AI generation worker)
                       ▼
                ┌─────────────┐
                │ generated   │  ← ready for serving
                └──────┬──────┘
                       │ release_wave ≤ CURRENT_RELEASE_WAVE
                       ▼
                ┌─────────────┐
                │    live     │  ← in sitemap, served as 200, indexable
                └──────┬──────┘
                       │ submitToIndexNow + sitemap submission
                       ▼
                ┌─────────────┐
                │   indexed   │  ← in Google/Bing/Yandex search index
                └─────────────┘
```

We control everything above the bottom box. The bottom box is the engines.

## Phased publishing — `release_wave`

Every route and airport row carries a `release_wave` integer. The app filters
all public reads with `release_wave <= CURRENT_RELEASE_WAVE` (env var, default 1).

To roll out a wave:

1. **Mark rows for the wave** (in SQL or via the generation pipeline):
   ```sql
   update routes set release_wave = 2
   where origin_iata in (top-50-airports);
   ```
2. **Bump the env var** in production: `CURRENT_RELEASE_WAVE=2`.
3. **Notify search engines** (one HTTP call):
   ```bash
   curl -X POST https://heritageflights.com/api/admin/notify-indexnow \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mode":"wave","wave":2}'
   ```

Sitemaps regenerate hourly (`revalidate = 3600`), so the new URLs appear in
`/routes/sitemap/[id].xml` within an hour without a redeploy. IndexNow gets
the news in seconds.

### Recommended rollout (from the strategy brief)

| Wave | Window     | Pages added       | Total live |
|------|------------|-------------------|------------|
| 1    | Day 1–7    | Top 50 cities × 14 + 100 airports | 5,000  |
| 2    | Week 2–3   | Next 200 cities + countries       | 20,000 |
| 3    | Week 4–6   | 1,000 cities complete + top routes | 70,000 |
| 4    | Month 2–3  | 5,000 cities + domestic routes    | 200,000 |
| 5    | Month 3–4  | All 12,000 cities + intl routes   | 500,000 |
| 6    | Month 4–6  | Comparisons, itineraries, longtail | 2,585,000 |

## Sitemaps

| URL | Contents |
|---|---|
| `/sitemap-index.xml` | **Submit this to Search Console.** A `<sitemapindex>` referencing every chunk below. |
| `/sitemap.xml` | Static pages (home, hotels, cars). |
| `/routes/sitemap/[0..N].xml` | Route pages, **45,000 URLs per chunk** (under Google's 50K cap). |
| `/airports/sitemap/[0..M].xml` | Airport hub pages, same chunking. |
| `/feed.xml` | RSS — latest 50 published routes for content-discovery crawlers. |

The chunk count auto-adjusts via `generateSitemaps()` based on row counts;
no manual chunk management needed.

## IndexNow (Bing / Yandex / Naver / Seznam / Yep)

Google doesn't accept IndexNow directly, but when Bing indexes a URL via
IndexNow, Googlebot often follows within hours — this is the standard
side-channel for instant indexing.

**Setup:**
1. Generate a 32-character URL-safe key (any random string).
2. Set `INDEXNOW_KEY=<key>` in `.env.local`.
3. The app serves the verification file automatically at `/i/<key>.txt`.

**Trigger after each batch publish:**
```bash
# Notify of routes published in the last 24h
curl -X POST https://heritageflights.com/api/admin/notify-indexnow \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"mode":"recent","hours":24}'

# Notify of a specific wave
curl -X POST https://heritageflights.com/api/admin/notify-indexnow \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"mode":"wave","wave":2}'
```

Returns `{ urls, submitted, status, message }`. Status `200/202` = accepted.

## Google Search Console setup (one-time)

1. Add a property at `https://search.google.com/search-console`.
2. Choose verification method "HTML tag" → copy the `content="..."` value.
3. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<that value>` and redeploy.
4. Click "Verify" in GSC — should pass.
5. In the property, go to **Sitemaps** → submit:
   - `https://heritageflights.com/sitemap-index.xml`
6. Optional but recommended — submit each chunked sitemap as well; some
   strategy guides report 20–30% faster indexing this way.

## Indexing health monitoring

```bash
curl https://heritageflights.com/api/admin/indexing-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Returns:
```jsonc
{
  "currentReleaseWave": 2,
  "routes": {
    "total":              67663,
    "published":          14200,
    "pending":            53463,
    "failed":             0,
    "liveInCurrentWave":  14200
  },
  "airports": { "total": 7697 },
  "waves":             [{ "wave": 1, "count": 5000 }, { "wave": 2, "count": 9200 }],
  "recentlyPublished": [/* 20 most recent */],
  "sitemapUrls":       { "index": "...", "static": "..." }
}
```

Plug this into a weekly Slack digest cron or build a dashboard on top.

## Crawl budget hygiene

Already in place:

- **SSR/ISR** via Next.js — all pages render as HTML, no JS-rendering queue.
- **Canonical URLs** — slug-mismatch redirects via `redirect()` in route page.
- **No URL parameters** in public URLs — clean paths only.
- **Hairline 401** on `/api/admin/*` so crawlers don't waste budget there.
- **robots.txt disallows** for `/api/`, `/i/`, `/_next/`, `/admin`, `/demo/`.
- **AhrefsBot / SemrushBot / MJ12bot / DotBot** explicitly blocked — these
  pull crawl budget without sending real traffic.

To verify post-deploy:
```bash
curl -s https://heritageflights.com/robots.txt
curl -s https://heritageflights.com/sitemap-index.xml | head -20
```

## File map

```
src/lib/
  env.ts                         ← INDEXNOW_KEY, GOOGLE_SITE_VERIFICATION, CURRENT_RELEASE_WAVE, ADMIN_TOKEN
  indexnow.ts                    ← submitToIndexNow() helper
  admin-auth.ts                  ← bearer-token guard for /api/admin/*
  queries.ts                     ← all reads filter by release_wave + status

src/app/
  sitemap.ts                     ← /sitemap.xml (static pages only)
  sitemap-index.xml/route.ts     ← /sitemap-index.xml (the index — SUBMIT THIS)
  robots.ts                      ← /robots.txt with tight disallows
  feed.xml/route.ts              ← /feed.xml (RSS)
  i/[indexnowKey]/route.ts       ← /i/<key>.txt for IndexNow verification
  api/admin/
    indexing-status/route.ts     ← GET, snapshot of pipeline state
    notify-indexnow/route.ts     ← POST, push batch to IndexNow

src/app/(content)/
  routes/sitemap.ts              ← /routes/sitemap/[id].xml (chunked, 45K each)
  airports/sitemap.ts            ← /airports/sitemap/[id].xml

supabase/migrations/
  0002_indexing.sql              ← adds release_wave + published_at columns + triggers
```
