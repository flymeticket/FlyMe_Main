/**
 * One-shot cleanup after the OpenAI-credit-exhaustion incident on 2026-05-21.
 *
 * The batch worker had a bug: when OpenAI returned a 429 insufficient_quota
 * error, generateAndPersistRoute caught the typed OpenAiCreditExhaustedError
 * in its general try/catch and marked the row as 'failed' instead of
 * re-throwing so the worker could halt. Result: a few hundred India routes
 * sit at status='failed' even though they were never actually attempted with
 * paid credits.
 *
 * This script reverts those rows to 'pending' so the next worker run picks
 * them up without needing --retry-failed. It only touches rows whose latest
 * generation_jobs entry mentions the credit / billing keywords, so any
 * genuinely-broken rows are left alone.
 */
import { getSupabaseAdmin } from '../src/lib/supabase';

async function main() {
  const sb = getSupabaseAdmin();

  // 1. India IATAs.
  const { data: airports } = await sb.from('airports').select('iata').eq('country', 'India');
  const iatas = (airports ?? []).map((a) => a.iata);

  // 2. Recent 'failed' India routes whose error mentions credits/billing/429.
  //    We pull the failed rows, then look up their most recent generation_jobs
  //    entry to inspect the error text.
  const { data: failedRoutes } = await sb
    .from('routes')
    .select('id, origin_iata, destination_iata')
    .in('origin_iata', iatas)
    .in('destination_iata', iatas)
    .eq('status', 'failed');

  const failed = failedRoutes ?? [];
  console.log(`Failed India routes to inspect: ${failed.length}`);

  const creditExhausted: string[] = [];
  for (const r of failed) {
    const { data: jobs } = await sb
      .from('generation_jobs')
      .select('error, completed_at')
      .eq('route_id', r.id)
      .order('completed_at', { ascending: false })
      .limit(1);
    const err = (jobs?.[0]?.error ?? '').toLowerCase();
    if (
      err.includes('credit') ||
      err.includes('billing') ||
      err.includes('insufficient_quota') ||
      err.includes('quota_exceeded') ||
      err.includes('429')
    ) {
      creditExhausted.push(r.id);
    }
  }

  console.log(`Marked credit-exhausted: ${creditExhausted.length}`);

  // 3. Stuck 'generating' rows — those are mid-flight rows from when we killed
  //    the worker. Safe to revert; the next worker re-processes them.
  const { data: stuck } = await sb
    .from('routes')
    .select('id')
    .in('origin_iata', iatas)
    .in('destination_iata', iatas)
    .eq('status', 'generating');
  const stuckIds = (stuck ?? []).map((r) => r.id);
  console.log(`Stuck 'generating' rows:    ${stuckIds.length}`);

  // 4. Revert both groups to 'pending' in chunks of 200.
  const toReset = [...creditExhausted, ...stuckIds];
  if (toReset.length === 0) {
    console.log('Nothing to reset.');
    return;
  }
  const CHUNK = 200;
  for (let i = 0; i < toReset.length; i += CHUNK) {
    const slice = toReset.slice(i, i + CHUNK);
    const { error } = await sb
      .from('routes')
      .update({ status: 'pending' })
      .in('id', slice);
    if (error) throw new Error(`reset chunk: ${error.message}`);
    console.log(`  reverted ${Math.min(i + CHUNK, toReset.length)}/${toReset.length}`);
  }
  console.log('Done.');
}
main().catch((e) => { console.error(e); process.exit(1); });
