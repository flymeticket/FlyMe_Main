import { getSupabaseAdmin } from '../src/lib/supabase';

async function main() {
  const sb = getSupabaseAdmin();

  // 1. Total cost actually logged by our worker
  const { data: ok } = await sb
    .from('generation_jobs')
    .select('cost_usd, tokens_used')
    .eq('status', 'published');
  const totalCost = (ok ?? []).reduce((s, j) => s + Number(j.cost_usd ?? 0), 0);
  const totalTokens = (ok ?? []).reduce((s, j) => s + Number(j.tokens_used ?? 0), 0);
  console.log(`Successful jobs:    ${ok?.length}`);
  console.log(`Total cost logged:  $${totalCost.toFixed(4)}`);
  console.log(`Total tokens:       ${totalTokens.toLocaleString()}`);
  console.log(`Avg cost/job:       $${(totalCost / Math.max(ok?.length ?? 1, 1)).toFixed(5)}`);
  console.log(`Avg tokens/job:     ${Math.round(totalTokens / Math.max(ok?.length ?? 1, 1))}`);

  // 2. One full sample of the 429 error message so we can see what OpenAI actually said
  const { data: failures } = await sb
    .from('generation_jobs')
    .select('error, completed_at')
    .eq('status', 'failed')
    .order('completed_at', { ascending: false })
    .limit(3);
  console.log('\nLast 3 failure error messages (full text):');
  for (const f of failures ?? []) {
    console.log('---');
    console.log(f.error);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
