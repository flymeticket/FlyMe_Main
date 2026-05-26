"""
Generate docs/ARCHITECTURE.pdf — operational reference for the Heritage Flights
codebase. Built with ReportLab Platypus; runs offline; no external deps beyond
reportlab itself.

    python scripts/build-architecture-pdf.py
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Preformatted, KeepTogether,
)

# ─── Brand palette (matches Backpack tokens used in the app) ────────────
NAVY  = HexColor('#05203C')   # primary headings, brand contrast
SKY   = HexColor('#0062E3')   # accents, links, emphasis
INK   = HexColor('#161616')   # body text
MUTED = HexColor('#5B646F')   # secondary text
LINE  = HexColor('#C1C7CF')   # borders
SOFT  = HexColor('#F6F8FA')   # code-block backgrounds
PILL  = HexColor('#E8F0FE')   # tag pill background

OUT_PATH = Path(__file__).parent.parent / 'docs' / 'ARCHITECTURE.pdf'
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# ─── Styles ─────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle(
    'TitleBig', parent=styles['Title'], fontName='Helvetica-Bold',
    fontSize=30, leading=34, textColor=NAVY, alignment=TA_LEFT,
    spaceAfter=4,
)
H_SUBTITLE = ParagraphStyle(
    'Subtitle', parent=styles['Normal'], fontName='Helvetica',
    fontSize=12, leading=16, textColor=MUTED, spaceAfter=18,
)
H1 = ParagraphStyle(
    'H1', parent=styles['Heading1'], fontName='Helvetica-Bold',
    fontSize=20, leading=24, textColor=NAVY,
    spaceBefore=18, spaceAfter=10,
)
H2 = ParagraphStyle(
    'H2', parent=styles['Heading2'], fontName='Helvetica-Bold',
    fontSize=14, leading=18, textColor=NAVY,
    spaceBefore=14, spaceAfter=6,
)
BODY = ParagraphStyle(
    'Body', parent=styles['Normal'], fontName='Helvetica',
    fontSize=10.5, leading=15, textColor=INK,
    spaceAfter=8,
)
LEAD = ParagraphStyle(
    'Lead', parent=BODY, fontSize=11.5, leading=17, textColor=INK,
    spaceAfter=12,
)
CALLOUT = ParagraphStyle(
    'Callout', parent=BODY, fontSize=10, leading=15, textColor=NAVY,
    backColor=PILL, borderColor=SKY, borderWidth=0,
    borderPadding=10, spaceAfter=12,
)
EYEBROW = ParagraphStyle(
    'Eyebrow', parent=BODY, fontName='Helvetica-Bold', fontSize=9,
    leading=12, textColor=SKY, spaceAfter=4,
)
CODE = ParagraphStyle(
    'Code', parent=styles['Code'], fontName='Courier',
    fontSize=8.5, leading=11.5, textColor=INK,
    backColor=SOFT, borderColor=LINE, borderWidth=0.5,
    borderPadding=8, leftIndent=0, rightIndent=0, spaceAfter=10,
)
SMALL = ParagraphStyle(
    'Small', parent=BODY, fontSize=9, leading=12, textColor=MUTED,
)

# ─── Helpers ────────────────────────────────────────────────────────────

def p(text, style=BODY): return Paragraph(text, style)
def gap(h=6):            return Spacer(1, h)

def code(text):
    """Mono-spaced block with soft background. Wraps lines at column width."""
    return Preformatted(text, CODE)

def section_rule():
    """A thin horizontal rule between major sections."""
    t = Table([['']], colWidths=[170*mm], rowHeights=[2])
    t.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.8, SKY),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    return t

# ─── Story ──────────────────────────────────────────────────────────────
story = []

# Cover header
story.append(p('HERITAGE FLIGHTS', EYEBROW))
story.append(p('Architecture Reference', H_TITLE))
story.append(p(
    'How the marketing site, content engine, and indexing engine fit together — '
    'plus a phased rollout playbook for getting millions of programmatic-SEO pages '
    'indexed by Google.', H_SUBTITLE,
))
story.append(section_rule())
story.append(gap(8))

# ─── Section 1: 3 layers ────────────────────────────────────────────────
story.append(p('1.', EYEBROW))
story.append(p('The site has three layers', H1))
story.append(p(
    'Every page lives in exactly one of these layers, and each layer has a '
    'different visual style, audience, and indexing goal.',
    LEAD,
))

layers_data = [
    ['Layer', 'What it is', 'Lives at'],
    ['1. Marketing site',
     'The cinematic home page — luxury aviation brand. Force-dark, full-bleed '
     '3D globe and plane scenes. No navbar, no theme switcher. Different '
     'audience from the SEO pages.',
     'app/page.tsx'],
    ['2. Content engine',
     'Programmatic SEO pages: route pages, airport pages, coming-soon pages, '
     'demo. Every page wears the SiteNav + dark/light toggle. Skyscanner / '
     'Backpack design tokens. Where the affiliate revenue happens.',
     'app/(content)/...'],
    ['3. Indexing engine',
     'Not visible to users — sitemaps, robots, IndexNow key file, GSC '
     'verification, RSS, admin status endpoints. Controls when and how '
     'search engines crawl and index the content layer.',
     'app/sitemap*, app/robots.ts, app/[indexnowKey], lib/indexnow.ts'],
]

t = Table(layers_data, colWidths=[35*mm, 100*mm, 35*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',     (0,0), (-1,0),  NAVY),
    ('TEXTCOLOR',      (0,0), (-1,0),  white),
    ('FONTNAME',       (0,0), (-1,0),  'Helvetica-Bold'),
    ('FONTSIZE',       (0,0), (-1,-1), 9),
    ('LEADING',        (0,0), (-1,-1), 12),
    ('VALIGN',         (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',     (0,0), (-1,-1), 8),
    ('BOTTOMPADDING',  (0,0), (-1,-1), 8),
    ('LEFTPADDING',    (0,0), (-1,-1), 8),
    ('RIGHTPADDING',   (0,0), (-1,-1), 8),
    ('GRID',           (0,0), (-1,-1), 0.4, LINE),
    ('BACKGROUND',     (0,1), (-1,-1), white),
    ('FONTNAME',       (2,1), (2,-1),  'Courier'),
    ('TEXTCOLOR',      (2,1), (2,-1),  SKY),
    ('FONTSIZE',       (2,1), (2,-1),  8),
]))
story.append(t)

story.append(PageBreak())

# ─── Section 2: File tree ───────────────────────────────────────────────
story.append(p('2.', EYEBROW))
story.append(p('Project map (annotated)', H1))
story.append(p(
    'The whole codebase fits on one page. Layer boundaries are explicit in the '
    'folder structure — the <font name="Courier">(content)</font> route group '
    'is the entire content engine, and indexing files cluster at the app root.',
    LEAD,
))

tree = """heritage_flights/
|
|-- supabase/migrations/
|   |-- 0001_init.sql              # airports, routes, generation_jobs, RLS
|   `-- 0002_indexing.sql          # + release_wave, published_at, triggers
|
|-- scripts/
|   |-- seed-openflights.ts        # Supabase <- OpenFlights CSV (idempotent)
|   |-- build-architecture-pdf.py  # This document's generator
|   `-- data/                      # local CSVs (7K airports, 67K routes)
|
|-- src/app/
|   |
|   |-- layout.tsx                 # <html>, theme init, GSC meta, sitemap link
|   |-- globals.css                # Backpack tokens, dark variant
|   |-- page.tsx                   # LAYER 1 (marketing) — force-dark, scoped
|   |
|   |-- sitemap.ts                 # LAYER 3 — small (static pages only)
|   |-- sitemap-index.xml/         # LAYER 3 — <sitemapindex>, submit to GSC
|   |   `-- route.ts
|   |-- robots.ts                  # LAYER 3 — allow/disallow, blocks SEO bots
|   |-- [indexnowKey]/             # LAYER 3 — /<key>.txt verification (root)
|   |   `-- route.ts
|   |
|   `-- (content)/                 # LAYER 2 — route group; doesn't affect URL
|       |
|       |-- layout.tsx             # injects <SiteNav /> on all content pages
|       |
|       |-- routes/
|       |   |-- sitemap.ts         # generateSitemaps() -> /routes/sitemap/[id].xml
|       |   `-- [origin]/[destination]/[slug]/page.tsx
|       |
|       |-- airports/
|       |   |-- sitemap.ts         # generateSitemaps() -> /airports/sitemap/[id].xml
|       |   `-- [iata]/page.tsx
|       |
|       |-- hotels/page.tsx        # coming-soon
|       |-- cars/page.tsx          # coming-soon
|       `-- demo/mumbai-to-goa/    # hand-written sample of generated content
|           `-- page.tsx
|
|-- src/components/
|   |-- layout/SiteNav.tsx         # logo, links, region, theme toggle, login
|   |-- layout/ComingSoon.tsx      # reusable empty-state for unbuilt surfaces
|   |-- theme/                     # FOUC-free dark/light switching
|   |   |-- theme-init.tsx         # inline <head> script, runs before paint
|   |   `-- theme-toggle.tsx       # sun/moon button
|   `-- flights/
|       |-- FlightSearchWidget.tsx # Skyscanner-style booking form
|       |-- RouteHeader.tsx, BookingCTA.tsx
|       `-- Markdown.tsx, FAQs.tsx, OtherFlights.tsx
|
`-- src/lib/
    |-- env.ts                     # validated env access (throws on missing)
    |-- supabase.ts                # public + admin (service-role) clients
    |-- database.types.ts          # row + insert types per table
    |-- openai.ts                  # client (Phase 2 content worker)
    |-- queries.ts                 # all DB reads, ALL wave-gated
    |-- slug.ts                    # canonical URL builders
    |-- affiliate.ts               # Skyscanner deep-link with associate ID
    `-- indexnow.ts                # POST /IndexNow with batched URLs"""

story.append(code(tree))

story.append(PageBreak())

# ─── Section 3: Data flow ───────────────────────────────────────────────
story.append(p('3.', EYEBROW))
story.append(p('Data flow', H1))
story.append(p(
    'Two inputs (a public dataset and an LLM) feed one source of truth '
    '(Supabase). Every public surface — pages, sitemaps, RSS — derives from '
    'that, with the wave gate as a single filter applied at read time.',
    LEAD,
))

flow = """           +-------------+
           |   OpenAI    |  <- Phase 2, not built yet
           |  GPT-4o-mini|
           +------+------+
                  |  generates hero_md, history_md,
                  |  faqs, meta_title, meta_description
                  v
   +----------+   +----------------------+
   | OpenFlts |-->|  Supabase (Postgres) |
   |   CSV    |   |  - airports          |
   +----------+   |  - routes            |
                  |  - generation_jobs   |
                  +----------+-----------+
                             |
                             | src/lib/queries.ts
                             | every read filters:
                             |   status = 'published'
                             |   release_wave <= CURRENT_RELEASE_WAVE
                             |
        +--------------------+--------------------+
        v                    v                    v
   +----------+        +-----------+       +---------------+
   |  Route   |        |  Airport  |       | Sitemap chunks|
   |  pages   |        |  pages    |       | 45K URLs each |
   +----------+        +-----------+       +-------+-------+
                                                   |
                                +------------------+-----------------+
                                v                  v                 v
                       +-----------------+  +--------------+  +-------------+
                       | /sitemap-       |  | Search       |  | IndexNow    |
                       | index.xml       |->| Console      |  | (Bing,      |
                       | <sitemapindex>  |  | (Google+Bing)|  | Yandex,     |
                       +-----------------+  +--------------+  | Naver,Yep)  |
                                                              +-------------+"""

story.append(code(flow))

story.append(PageBreak())

# ─── Section 4: Indexing engine pieces ──────────────────────────────────
story.append(p('4.', EYEBROW))
story.append(p('Indexing engine — five concrete pieces', H1))
story.append(p(
    'Each piece is a small file. Together they implement the mega-scale SEO '
    'pattern recommended by Google: chunked sitemaps, explicit crawl-budget '
    'rules, IndexNow side-channel for Bing, and a single env-var release switch.',
    LEAD,
))

pieces = [
    ['Piece', 'Where it lives', 'Job'],
    ['Wave gate',
     'env.currentReleaseWave + .lte("release_wave", …) in every query',
     'One env var controls which DB rows are publicly visible. Bump '
     'CURRENT_RELEASE_WAVE next week to unlock Phase 2.'],
    ['Chunked sitemaps',
     '(content)/routes/sitemap.ts\n(content)/airports/sitemap.ts',
     'generateSitemaps() fans each segment into 45K-row chunks. At 67K routes '
     '-> 2 chunks. At 25 lakh -> ~56 chunks, all auto-generated.'],
    ['Sitemap-index',
     'app/sitemap-index.xml/route.ts',
     'Hand-built <sitemapindex> XML — the single URL you submit to GSC and '
     'Bing Webmaster. References every chunk.'],
    ['IndexNow',
     'lib/indexnow.ts +\napp/[indexnowKey]/route.ts',
     'Push up to 10K URLs per call to Bing, Yandex, Naver, Yep. Google '
     'notices indirectly. Key file proves ownership.'],
    ['Crawl-budget hygiene',
     'app/robots.ts',
     'Explicit Disallow on /api/, /i/, /_next/, /admin, /demo/. Blocks '
     'AhrefsBot/SemrushBot/MJ12/DotBot. Points crawlers at sitemap-index.'],
]

t = Table(pieces, colWidths=[35*mm, 55*mm, 80*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',     (0,0), (-1,0),  NAVY),
    ('TEXTCOLOR',      (0,0), (-1,0),  white),
    ('FONTNAME',       (0,0), (-1,0),  'Helvetica-Bold'),
    ('FONTSIZE',       (0,0), (-1,-1), 9),
    ('LEADING',        (0,0), (-1,-1), 12),
    ('VALIGN',         (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',     (0,0), (-1,-1), 7),
    ('BOTTOMPADDING',  (0,0), (-1,-1), 7),
    ('LEFTPADDING',    (0,0), (-1,-1), 8),
    ('RIGHTPADDING',   (0,0), (-1,-1), 8),
    ('GRID',           (0,0), (-1,-1), 0.4, LINE),
    ('FONTNAME',       (0,1), (0,-1),  'Helvetica-Bold'),
    ('TEXTCOLOR',      (0,1), (0,-1),  NAVY),
    ('FONTNAME',       (1,1), (1,-1),  'Courier'),
    ('TEXTCOLOR',      (1,1), (1,-1),  SKY),
    ('FONTSIZE',       (1,1), (1,-1),  8),
]))
story.append(t)

story.append(PageBreak())

# ─── Section 5: Wave gate ───────────────────────────────────────────────
story.append(p('5.', EYEBROW))
story.append(p('The wave gate, in detail', H1))
story.append(p(
    'Phased publishing is the single biggest indexing accelerator after buying '
    'an aged domain. The wave gate makes it a one-line config change instead '
    'of a deploy.',
    LEAD,
))

story.append(p('Schema (migration 0002)', H2))
story.append(code(
    "-- Both columns default to 1 — existing rows pass the gate at wave 1.\n"
    "ALTER TABLE routes\n"
    "  ADD COLUMN release_wave  integer NOT NULL DEFAULT 1,\n"
    "  ADD COLUMN published_at  timestamptz;\n\n"
    "-- Same on airports.\n"
    "-- A trigger stamps published_at when status flips to 'published'."
))

story.append(p('Read path (src/lib/queries.ts)', H2))
story.append(code(
    "const CURRENT_WAVE = env.currentReleaseWave;\n\n"
    "// Every public-facing query applies BOTH filters:\n"
    "await supabase.from('routes')\n"
    "  .select('*')\n"
    "  .eq('origin_iata', o).eq('destination_iata', d)\n"
    "  .eq('status', 'published')          // generated content exists\n"
    "  .lte('release_wave', CURRENT_WAVE)  // wave unlocked\n"
    "  .maybeSingle();"
))

story.append(p('Phased rollout schedule', H2))

phases = [
    ['Wave', 'When', 'Pages live', 'Action'],
    ['1', 'Day 1',     '~5,000',     'CURRENT_RELEASE_WAVE=1 (default)'],
    ['2', 'Week 2',    '~20,000',    'Bump env var; redeploy'],
    ['3', 'Week 6',    '~70,000',    'Bump env var'],
    ['4', 'Month 2-3', '~2,00,000',  'Bump env var'],
    ['5', 'Month 3-4', '~5,00,000',  'Bump env var'],
    ['6', 'Month 4-6', '~25,85,000', 'Final phase — all routes unlocked'],
]
t = Table(phases, colWidths=[15*mm, 25*mm, 30*mm, 100*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), NAVY),
    ('TEXTCOLOR',     (0,0), (-1,0), white),
    ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 9),
    ('LEADING',       (0,0), (-1,-1), 12),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 8),
    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ('GRID',          (0,0), (-1,-1), 0.4, LINE),
    ('ALIGN',         (0,1), (0,-1), 'CENTER'),
    ('FONTNAME',      (0,1), (0,-1), 'Helvetica-Bold'),
    ('TEXTCOLOR',     (0,1), (0,-1), SKY),
    ('FONTNAME',      (3,1), (3,-1), 'Courier'),
    ('FONTSIZE',      (3,1), (3,-1), 8),
]))
story.append(t)

story.append(gap(10))
story.append(p(
    'Routes generated into a future wave stay literally invisible: not in any '
    'sitemap, not internally linked, 404 if hit directly. Google never sees '
    'a spam signal from "millions of pages appeared overnight".',
    CALLOUT,
))

story.append(PageBreak())

# ─── Section 6: Tactic mapping ──────────────────────────────────────────
story.append(p('6.', EYEBROW))
story.append(p('Tactic from the brief -> implementation', H1))
story.append(p(
    'A direct mapping from the 12 acceleration tactics in the indexing brief '
    'to where each one is implemented (or where it lives outside code).',
    LEAD,
))

tactics = [
    ['#', 'Tactic', 'Where in the codebase'],
    ['1',  'Buy aged domain (DA 30+)',
     'External — buy from Odys / ExpiredDomains. Point NEXT_PUBLIC_SITE_URL at it.'],
    ['2',  'Phased publishing',
     'release_wave column + CURRENT_RELEASE_WAVE env var (see section 5).'],
    ['3',  'Clean XML sitemaps (50K chunks)',
     '(content)/{routes,airports}/sitemap.ts via generateSitemaps().'],
    ['4',  'IndexNow for Bing/Yandex',
     'lib/indexnow.ts + app/[indexnowKey]/route.ts.'],
    ['5',  'Server speed under 200ms',
     'Next.js 16 ISR (revalidate=86400) + Vercel edge / Cloudflare CDN at deploy.'],
    ['6',  'Internal linking architecture',
     'components/flights/OtherFlights.tsx — every route page links 8 siblings.'],
    ['7',  'Backlinks from Day 1',
     'External — directories, guest posts, HARO. No code.'],
    ['8',  'GSC submission',
     'Submit /sitemap-index.xml. GSC token via NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.'],
    ['9',  'Server-side rendering',
     'Native — Next.js App Router with generateStaticParams + revalidate.'],
    ['10', 'Eliminate crawl waste',
     'app/robots.ts (disallows) + slug-mismatch redirect in route page.'],
    ['11', 'Google ping / RSS',
     'PENDING — /feed.xml route to be added next.'],
    ['12', 'Social signals',
     'External — manual sharing pipelines.'],
]
t = Table(tactics, colWidths=[10*mm, 55*mm, 105*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), NAVY),
    ('TEXTCOLOR',     (0,0), (-1,0), white),
    ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 9),
    ('LEADING',       (0,0), (-1,-1), 12),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 7),
    ('RIGHTPADDING',  (0,0), (-1,-1), 7),
    ('GRID',          (0,0), (-1,-1), 0.4, LINE),
    ('ALIGN',         (0,1), (0,-1), 'CENTER'),
    ('FONTNAME',      (0,1), (0,-1), 'Helvetica-Bold'),
    ('TEXTCOLOR',     (0,1), (0,-1), SKY),
    ('FONTNAME',      (1,1), (1,-1), 'Helvetica-Bold'),
    ('TEXTCOLOR',     (1,1), (1,-1), NAVY),
    ('FONTSIZE',      (2,1), (2,-1), 9),
]))
story.append(t)

story.append(PageBreak())

# ─── Section 7: Built vs pending ────────────────────────────────────────
story.append(p('7.', EYEBROW))
story.append(p('What ships today / what is still pending', H1))
story.append(p(
    'A scoreboard of the indexing engine as of today.',
    LEAD,
))

story.append(p('Built and verified', H2))
status_built = [
    ['Item', 'Path'],
    ['Wave gate columns + triggers',         'supabase/migrations/0002_indexing.sql'],
    ['Wave-aware queries',                   'src/lib/queries.ts'],
    ['Chunked sitemap: routes',              'src/app/(content)/routes/sitemap.ts'],
    ['Chunked sitemap: airports',            'src/app/(content)/airports/sitemap.ts'],
    ['Sitemap-index <sitemapindex> XML',     'src/app/sitemap-index.xml/route.ts'],
    ['IndexNow client',                      'src/lib/indexnow.ts'],
    ['IndexNow key-file route',              'src/app/[indexnowKey]/route.ts'],
    ['GSC verification meta tag',            'src/app/layout.tsx'],
    ['robots.txt with disallows',            'src/app/robots.ts'],
    ['env validation + admin token slot',    'src/lib/env.ts'],
]
t = Table(status_built, colWidths=[80*mm, 90*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), SKY),
    ('TEXTCOLOR',     (0,0), (-1,0), white),
    ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 9),
    ('LEADING',       (0,0), (-1,-1), 12),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING',   (0,0), (-1,-1), 7),
    ('RIGHTPADDING',  (0,0), (-1,-1), 7),
    ('GRID',          (0,0), (-1,-1), 0.4, LINE),
    ('FONTNAME',      (1,1), (1,-1), 'Courier'),
    ('TEXTCOLOR',     (1,1), (1,-1), NAVY),
    ('FONTSIZE',      (1,1), (1,-1), 8),
]))
story.append(t)

story.append(gap(14))
story.append(p('Pending', H2))
pending = [
    ['Item', 'Notes'],
    ['Move IndexNow route under /i/',
     'Today it sits at the root catch-all. Risk: shadows other paths if any '
     'unexpected URL is hit. Move to app/i/[indexnowKey]/route.ts and update '
     'keyLocation in lib/indexnow.ts.'],
    ['RSS feed at /feed.xml',
     'Latest 50 published routes. Lets Google discover new content via '
     'PubSubHubbub. Tactic 11 in the brief.'],
    ['/api/admin/indexing-status JSON',
     'Returns counts: pages in current wave, pending generation, last '
     'IndexNow batch result. Gated by ADMIN_TOKEN bearer.'],
    ['docs/INDEXING.md operational playbook',
     'Step-by-step: bump wave, run IndexNow batch, monitor GSC. To be '
     'written; this PDF is a starting point.'],
    ['Phase 2: OpenAI content worker',
     'Cron / route handler that picks pending routes from generation_jobs, '
     'calls GPT-4o-mini with a structured prompt, writes hero_md / faqs / '
     'meta back into routes, marks status=published.'],
    ['Final build verification',
     'Run npm run build after the items above land, confirm all routes '
     'still resolve and sitemaps generate correctly.'],
]
t = Table(pending, colWidths=[60*mm, 110*mm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), HexColor('#B45309')),  # amber for pending
    ('TEXTCOLOR',     (0,0), (-1,0), white),
    ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 9),
    ('LEADING',       (0,0), (-1,-1), 12),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 8),
    ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ('GRID',          (0,0), (-1,-1), 0.4, LINE),
    ('FONTNAME',      (0,1), (0,-1), 'Helvetica-Bold'),
    ('TEXTCOLOR',     (0,1), (0,-1), NAVY),
]))
story.append(t)

story.append(gap(20))
story.append(p('Footer', EYEBROW))
story.append(p(
    'Heritage Flights · Architecture Reference · generated from '
    'scripts/build-architecture-pdf.py · regenerate any time with '
    '<font name="Courier">python scripts/build-architecture-pdf.py</font>.',
    SMALL,
))

# ─── Build ──────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    str(OUT_PATH),
    pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=18*mm, bottomMargin=18*mm,
    title='Heritage Flights — Architecture Reference',
    author='Heritage Flights',
)

def footer(canvas, doc):
    """Page footer with page number + brand."""
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 10*mm, 'Heritage Flights · Architecture Reference')
    canvas.drawRightString(190*mm, 10*mm, f'p. {doc.page}')
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.3)
    canvas.line(20*mm, 13*mm, 190*mm, 13*mm)
    canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'wrote {OUT_PATH}')
print(f'size: {OUT_PATH.stat().st_size:,} bytes')
