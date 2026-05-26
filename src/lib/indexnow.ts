import { env } from './env';

// IndexNow — open protocol used by Bing, Yandex, Naver, Seznam, and Yep.
// Push a batch of fresh URLs and they crawl within minutes.
// Google doesn't accept IndexNow directly, but when Bing indexes a URL
// Google's crawler often follows — this is the standard side-channel.
//
// Endpoint: https://api.indexnow.org/IndexNow
// Spec:     https://www.indexnow.org/documentation
//
// Pre-requisite: a `<key>.txt` file at the site root containing the same key
// (served by /[key].txt route). The script auto-skips when no key is set.

const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const MAX_BATCH = 10_000; // IndexNow hard cap per submission

export interface IndexNowResult {
  submitted: number;
  status: number;
  message: string;
}

export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!env.indexNowKey) {
    return { submitted: 0, status: 0, message: 'INDEXNOW_KEY not set — skipping.' };
  }
  if (urls.length === 0) {
    return { submitted: 0, status: 0, message: 'No URLs to submit.' };
  }

  // De-dupe and chunk
  const unique = Array.from(new Set(urls));
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += MAX_BATCH) {
    chunks.push(unique.slice(i, i + MAX_BATCH));
  }

  const host = new URL(env.siteUrl).host;
  let totalSubmitted = 0;
  let lastStatus = 0;

  for (const batch of chunks) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: env.indexNowKey,
        keyLocation: `${env.siteUrl}/i/${env.indexNowKey}.txt`,
        urlList: batch,
      }),
    });
    lastStatus = res.status;
    if (res.ok || res.status === 202) {
      totalSubmitted += batch.length;
    } else {
      // 422 = invalid host/key. Don't keep flogging the API.
      return {
        submitted: totalSubmitted,
        status: res.status,
        message: await res.text().catch(() => res.statusText),
      };
    }
  }

  return {
    submitted: totalSubmitted,
    status: lastStatus,
    message: `OK (${chunks.length} batch${chunks.length > 1 ? 'es' : ''})`,
  };
}
