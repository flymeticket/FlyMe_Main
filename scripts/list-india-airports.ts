import { getSupabaseAdmin } from '../src/lib/supabase';

async function main() {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('airports')
    .select('iata, city, name')
    .eq('country', 'India')
    .order('iata');
  for (const a of data ?? []) {
    console.log(`${a.iata}  ${a.city.padEnd(25)}  ${a.name}`);
  }
  console.log(`\nTotal: ${data?.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
