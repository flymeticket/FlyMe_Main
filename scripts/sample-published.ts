/**
 * Print sample URLs for already-published routes so they can be eyeball-checked
 * in the browser. Also confirms the sitemap chunking math (Google caps at 50K
 * URLs/file; we use 45K with safety margin).
 */
import { getSupabaseAdmin } from '../src/lib/supabase';
import { buildRoutePath } from '../src/lib/slug';
import { env } from '../src/lib/env';

async function main() {
  const sb = getSupabaseAdmin();
  const siteUrl = env.siteUrl || 'http://localhost:3000';

  // India airports
  const { data: airports } = await sb.from('airports').select('iata').eq('country', 'India');
  const iatas = (airports ?? []).map((a) => a.iata);

  // Total published India routes (what the sitemap will emit)
  const { count: totalPub } = await sb
    .from('routes')
    .select('id', { count: 'exact', head: true })
    .in('origin_iata', iatas)
    .in('destination_iata', iatas)
    .eq('status', 'published')
    .lte('release_wave', env.currentReleaseWave);

  console.log(`Live in sitemap (India, wave<=${env.currentReleaseWave}): ${totalPub}`);
  console.log(`Sitemap chunks needed: ${Math.max(1, Math.ceil((totalPub ?? 0) / 45_000))}`);
  console.log('');

  // 10 sample URLs (recent first)
  const { data: rows } = await sb
    .from('routes')
    .select('origin_iata, destination_iata, slug, generated_at, meta_title')
    .in('origin_iata', iatas)
    .in('destination_iata', iatas)
    .eq('status', 'published')
    .order('generated_at', { ascending: false })
    .limit(10);

  console.log('Sample published India route URLs (10 most-recent):');
  for (const r of rows ?? []) {
    const path = buildRoutePath(r.origin_iata, r.destination_iata, r.slug);
    console.log(`  ${siteUrl}${path}`);
    console.log(`    title: ${r.meta_title?.slice(0, 90) ?? '(no title)'}`);
  }

  console.log('');
  console.log('Sitemap entry points:');
  console.log(`  ${siteUrl}/sitemap-index.xml      ← master index`);
  console.log(`  ${siteUrl}/routes/sitemap/0.xml   ← all published routes (chunk 0)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
