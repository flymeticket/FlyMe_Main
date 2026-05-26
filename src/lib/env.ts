// Centralised env access. Throws early at server-startup if required vars are missing,
// so misconfiguration surfaces at boot rather than on first request.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.local.example.`
    );
  }
  return value;
}

export const env = {
  // Public — available in the browser
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  skyscannerAssociateId: process.env.NEXT_PUBLIC_SKYSCANNER_ASSOCIATE_ID ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',

  // ─── Indexing engine ───────────────────────────────────────────────
  // Bump this number once per publishing wave to unlock the next batch of
  // pages. Routes with release_wave > this value stay hidden (404 + not in
  // sitemap). Default 1 keeps Phase-1 (foundation) live only.
  currentReleaseWave: Number(process.env.CURRENT_RELEASE_WAVE ?? '1'),

  // IndexNow key — any URL-safe 32-char string. Written to /<key>.txt so
  // search engines can verify ownership before accepting URL submissions.
  indexNowKey: process.env.INDEXNOW_KEY ?? '',

  // Server-only — accessing these from a client component will be undefined and throw
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get openaiApiKey() {
    return required('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
  },
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',

  // Admin endpoints require this bearer token in the Authorization header.
  // Set to a long random string in production.
  get adminToken() {
    return required('ADMIN_TOKEN', process.env.ADMIN_TOKEN);
  },
};
