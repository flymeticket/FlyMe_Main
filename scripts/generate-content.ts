/**
 * Phase 2 — content generation worker (batch mode).
 *
 *   npm run generate                      # all pending routes
 *   npm run generate:india                # India only
 *   npm run generate:india:test           # 10-route smoke test
 *
 * Pulls `status='pending'` routes from Supabase, calls GPT-4o-mini for each
 * via lib/content-generator.ts, and writes the result back. Designed to be
 * killed and restarted safely — re-running picks up where it left off
 * because rows flip to 'published' or 'failed' as they complete.
 *
 * Concurrency: configurable, default 5. Higher = faster but more chance of
 * hitting OpenAI rate limits.
 *
 * Cost estimate: ~$0.001 per route at gpt-4o-mini. 4,970 Indian routes ≈ $5.
 *
 * Flags:
 *   --limit=N           Only process the first N pending routes
 *   --concurrency=N     Parallel OpenAI requests (1-20, default 5)
 *   --country=India     Only generate routes where BOTH airports are in that country
 *   --retry-failed      Also re-attempt rows marked 'failed'
 *   --milestone=N       Print a summary every N completed routes (default 1000)
 *
 * Behaviour:
 *   • Every <milestone> completed routes the worker prints a summary line
 *     AND writes scripts/data/generation-status.json — total built, total
 *     OpenAI spend, ETA. External tools can poll this file.
 *   • If OpenAI returns a quota / billing error, the worker stops cleanly
 *     and prints how far it got + how much it cost so far.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getSupabaseAdmin } from '../src/lib/supabase';
import {
  generateAndPersistRoute,
  OpenAiCreditExhaustedError,
} from '../src/lib/content-generator';
import type { RouteRow, GenerationStatus } from '../src/lib/database.types';

// ─── CLI arg parsing ─────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const LIMIT        = Number(args.limit) || Infinity;
const CONCURRENCY  = Math.max(1, Math.min(20, Number(args.concurrency) || 5));
const COUNTRY      = args.country as string | undefined;
const RETRY_FAILED = args['retry-failed'] === 'true';
const MILESTONE    = Math.max(1, Number(args.milestone) || 1000);

const STATUS_FILE = resolve(__dirname, 'data', 'generation-status.json');

// ─── Fetch the queue ─────────────────────────────────────────────────────
async function fetchPendingRoutes(): Promise<RouteRow[]> {
  const supabase = getSupabaseAdmin();
  const statuses: GenerationStatus[] = RETRY_FAILED
    ? ['pending', 'failed']
    : ['pending'];

  let originIatas: string[] | undefined;
  if (COUNTRY) {
    const { data: airports } = await supabase
      .from('airports')
      .select('iata')
      .eq('country', COUNTRY);
    originIatas = (airports ?? []).map((a) => a.iata);
    console.log(`Country filter: ${COUNTRY} → ${originIatas.length} airports`);
  }

  // Supabase caps a single .select() at 1,000 rows. For "give me everything
  // pending" we paginate via .range() in chunks of 1,000 until exhausted.
  const PAGE = 1000;
  const all: RouteRow[] = [];

  for (let offset = 0; ; offset += PAGE) {
    let q = supabase
      .from('routes')
      .select('*')
      .in('status', statuses)
      .order('id')
      .range(offset, offset + PAGE - 1);

    if (originIatas) {
      q = q.in('origin_iata', originIatas).in('destination_iata', originIatas);
    }

    const { data, error } = await q;
    if (error) throw new Error(`fetch queue: ${error.message}`);
    const page = (data as RouteRow[]) ?? [];
    all.push(...page);
    if (page.length < PAGE) break;          // last page
    if (LIMIT !== Infinity && all.length >= LIMIT) break;
  }

  return LIMIT === Infinity ? all : all.slice(0, LIMIT);
}

// ─── Snapshot: how much have we built across the whole DB? ───────────────
async function totalPublishedCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from('routes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  return count ?? 0;
}

// ─── Milestone log + status file ─────────────────────────────────────────
async function writeStatusFile(payload: Record<string, unknown>): Promise<void> {
  try {
    await writeFile(STATUS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    // Don't kill the run because the status file failed to write.
    console.error(`  ⚠ could not write status file: ${err}`);
  }
}

function printMilestone({
  done, failed, queueSize, totalCost, t0, totalPublished,
}: {
  done: number; failed: number; queueSize: number;
  totalCost: number; t0: number; totalPublished: number;
}): void {
  const elapsed = (Date.now() - t0) / 1000;
  const rate = done / elapsed;                  // routes/sec
  const remaining = queueSize - done;
  const etaSec = rate > 0 ? remaining / rate : 0;
  console.log('');
  console.log('━'.repeat(70));
  console.log(`  MILESTONE — ${done.toLocaleString()} / ${queueSize.toLocaleString()} processed in this run`);
  console.log('━'.repeat(70));
  console.log(`  This run:    ${done - failed} ok · ${failed} failed`);
  console.log(`  AI credits:  $${totalCost.toFixed(3)} spent  (avg $${(totalCost / Math.max(done, 1)).toFixed(4)} per page)`);
  console.log(`  DB pages:    ${totalPublished.toLocaleString()} routes published across the whole DB`);
  console.log(`  Rate:        ${rate.toFixed(2)} routes/sec`);
  console.log(`  ETA:         ${Math.round(etaSec)}s (${(etaSec / 60).toFixed(1)} min) for ${remaining.toLocaleString()} remaining`);
  console.log('━'.repeat(70));
  console.log('');
}

// ─── Concurrency runner ──────────────────────────────────────────────────
async function processWithConcurrency<T>(
  items: T[],
  worker: (item: T, idx: number) => Promise<void>,
  concurrency: number,
  shouldStop: () => boolean,
): Promise<void> {
  let next = 0;
  async function lane() {
    while (true) {
      if (shouldStop()) return;
      const i = next++;
      if (i >= items.length) return;
      try {
        await worker(items[i], i);
      } catch (err) {
        console.error(`  ✗ lane error: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, lane));
}

// ─── Main ────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const t0 = Date.now();
  console.log('FlyMyTicket · Phase 2 content generator');
  console.log(
    `  limit=${LIMIT === Infinity ? 'all' : LIMIT}` +
    `  concurrency=${CONCURRENCY}` +
    `  country=${COUNTRY ?? 'any'}` +
    `  retry-failed=${RETRY_FAILED}` +
    `  milestone=${MILESTONE}`,
  );

  const queue = await fetchPendingRoutes();
  if (queue.length === 0) {
    console.log('Nothing to generate — queue is empty.');
    return;
  }
  console.log(`Queue size: ${queue.length} routes`);
  console.log(`Status file: ${STATUS_FILE}\n`);

  let done = 0;
  let failed = 0;
  let totalCost = 0;
  let creditExhausted = false;
  let lastMilestoneAt = 0;

  await processWithConcurrency(
    queue,
    async (route) => {
      try {
        const { ok, costUsd, error } = await generateAndPersistRoute(route);
        done += 1;
        totalCost += costUsd;
        if (!ok) failed += 1;
        const tag = ok ? '✓' : '✗';
        process.stdout.write(
          `  ${tag} ${route.origin_iata}→${route.destination_iata}` +
          `  ${done}/${queue.length}  $${totalCost.toFixed(3)}` +
          (error ? `  err=${error.slice(0, 60)}` : '') + '\n',
        );

        // Milestone every N completed routes
        if (done - lastMilestoneAt >= MILESTONE) {
          lastMilestoneAt = done;
          const totalPublished = await totalPublishedCount();
          printMilestone({ done, failed, queueSize: queue.length, totalCost, t0, totalPublished });
          await writeStatusFile({
            updatedAt: new Date().toISOString(),
            doneThisRun: done,
            failedThisRun: failed,
            queueSizeThisRun: queue.length,
            costUsdThisRun: Number(totalCost.toFixed(4)),
            avgCostPerPage: Number((totalCost / done).toFixed(5)),
            totalPublishedAllTime: totalPublished,
            elapsedSec: Math.round((Date.now() - t0) / 1000),
          });
        }
      } catch (err) {
        if (err instanceof OpenAiCreditExhaustedError) {
          creditExhausted = true;
          throw err; // bubble up to the lane so it stops
        }
        throw err;
      }
    },
    CONCURRENCY,
    () => creditExhausted,
  );

  // Final summary — also written as status file
  const dt = (Date.now() - t0) / 1000;
  const totalPublished = await totalPublishedCount();

  console.log('');
  console.log('━'.repeat(70));
  if (creditExhausted) {
    console.log('  ⚠  OPENAI CREDITS EXHAUSTED — worker halted');
    console.log(`     Top up at https://platform.openai.com/account/billing`);
    console.log(`     Then re-run the same command; rows already 'published' will be skipped.`);
  } else {
    console.log('  ✓  RUN COMPLETE');
  }
  console.log('━'.repeat(70));
  console.log(`  Time:           ${dt.toFixed(1)}s (${(dt / 60).toFixed(1)} min)`);
  console.log(`  Succeeded:      ${done - failed} / ${queue.length}`);
  console.log(`  Failed:         ${failed}`);
  console.log(`  OpenAI spend:   $${totalCost.toFixed(3)}`);
  console.log(`  Avg per page:   $${(totalCost / Math.max(done, 1)).toFixed(4)}`);
  console.log(`  Total in DB:    ${totalPublished.toLocaleString()} published routes`);
  console.log('━'.repeat(70));

  await writeStatusFile({
    updatedAt: new Date().toISOString(),
    doneThisRun: done,
    failedThisRun: failed,
    queueSizeThisRun: queue.length,
    costUsdThisRun: Number(totalCost.toFixed(4)),
    avgCostPerPage: Number((totalCost / Math.max(done, 1)).toFixed(5)),
    totalPublishedAllTime: totalPublished,
    elapsedSec: Math.round(dt),
    finishedAt: new Date().toISOString(),
    haltedReason: creditExhausted ? 'openai_credits_exhausted' : null,
  });

  if (creditExhausted) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
