import { getSupabaseAdmin } from '../src/lib/supabase';

async function main() {
  const sb = getSupabaseAdmin();

  console.log('By status (all routes):');
  for (const s of ['pending', 'generating', 'published', 'failed']) {
    const { count } = await sb
      .from('routes').select('id', { count: 'exact', head: true })
      .eq('status', s);
    console.log(`  status=${s.padEnd(11)} ${count?.toLocaleString()}`);
  }

  const { count: totalAll } = await sb
    .from('routes').select('id', { count: 'exact', head: true });
  console.log(`\nTotal routes in DB: ${totalAll?.toLocaleString()}`);

  const { data: airports } = await sb.from('airports').select('iata').eq('country', 'India');
  const iatas = (airports ?? []).map((a) => a.iata);
  console.log(`India airports:     ${iatas.length}`);

  const { count: indDomTotal } = await sb
    .from('routes').select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas).in('destination_iata', iatas);
  const { count: indDomPub } = await sb
    .from('routes').select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas).in('destination_iata', iatas)
    .eq('status', 'published');
  const { count: indDomPend } = await sb
    .from('routes').select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas).in('destination_iata', iatas)
    .eq('status', 'pending');
  const { count: indDomGen } = await sb
    .from('routes').select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas).in('destination_iata', iatas)
    .eq('status', 'generating');
  const { count: indDomFail } = await sb
    .from('routes').select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas).in('destination_iata', iatas)
    .eq('status', 'failed');

  console.log('\nIndia domestic (both ends in India):');
  console.log(`  total      ${indDomTotal?.toLocaleString()}`);
  console.log(`  published  ${indDomPub?.toLocaleString()}`);
  console.log(`  pending    ${indDomPend?.toLocaleString()}`);
  console.log(`  generating ${indDomGen?.toLocaleString()}`);
  console.log(`  failed     ${indDomFail?.toLocaleString()}`);

  // Release-wave breakdown (in case the user is filtering on wave=1)
  console.log('\nPublished routes by release_wave:');
  for (const w of [1, 2, 3, 4, 5]) {
    const { count } = await sb
      .from('routes').select('id', { count: 'exact', head: true })
      .eq('status', 'published').eq('release_wave', w);
    if (count && count > 0) console.log(`  wave=${w}  ${count?.toLocaleString()}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
