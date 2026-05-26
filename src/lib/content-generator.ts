import { z } from 'zod';
import type { AirportRow, RouteRow, RouteFaq } from './database.types';
import { getOpenAI } from './openai';
import { getSupabaseAdmin } from './supabase';
import { env } from './env';

// ─── Phase 2: GPT-4o-mini content generator ──────────────────────────────
// Given a (origin, destination) airport pair, asks GPT for a structured JSON
// payload of all the SEO content fields we need, writes them back to the
// `routes` row, and logs token usage to `generation_jobs`.
//
// Cost target: ~$0.001 per route at gpt-4o-mini pricing.
//
// Used by:
//   • scripts/generate-content.ts  (overnight batch worker)
//   • /api/admin/generate-route    (on-demand regeneration endpoint)

// JSON schema GPT returns. Slightly forgiving — we coerce nulls to empty,
// accept both {q,a} and {question,answer} shapes for FAQs (GPT sometimes
// reverts to the more verbose key names), and only floor the lengths at
// "very short" so the rare terse response still gets accepted instead of
// burning credits on retries.
const FaqItem = z.preprocess(
  // Normalise faq item shape: accept {q,a} or {question,answer}.
  (raw) => {
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      return {
        q: o.q ?? o.question ?? '',
        a: o.a ?? o.answer ?? '',
      };
    }
    return raw;
  },
  z.object({ q: z.string().min(5), a: z.string().min(10) }),
);

const ContentSchema = z.object({
  meta_title: z.string().min(10).max(120),
  meta_description: z.string().min(40).max(220),
  hero_md: z.string().min(60),
  history_md: z.string().min(80),
  faqs: z.array(FaqItem).min(4).max(12),
  distance_km: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) =>
      v == null || v === '' ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null,
    )
    .nullable()
    .optional(),
  typical_duration_min: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) =>
      v == null || v === '' ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null,
    )
    .nullable()
    .optional(),
});

export type GeneratedContent = z.infer<typeof ContentSchema>;

/**
 * Thrown when OpenAI returns a quota / billing error. The batch worker
 * catches this specifically and halts the run with a clear message —
 * there's no point retrying when the bill needs paying first.
 *
 * Maps to HTTP 401 (`invalid_api_key`), 429 (`insufficient_quota`,
 * `quota_exceeded`), and 402 (`payment_required`).
 */
export class OpenAiCreditExhaustedError extends Error {
  constructor(message: string, public readonly httpStatus?: number) {
    super(message);
    this.name = 'OpenAiCreditExhaustedError';
  }
}

/** Heuristic: is this OpenAI error a "you need to top up" situation? */
function isCreditExhausted(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; code?: string; type?: string; message?: string };
  if (e.status === 401 || e.status === 402) return true;
  if (e.status === 429) {
    const code = (e.code ?? '').toLowerCase();
    const type = (e.type ?? '').toLowerCase();
    // OpenAI uses these codes for billing / quota vs transient rate limits.
    return (
      code.includes('insufficient_quota') ||
      code.includes('quota_exceeded') ||
      type.includes('insufficient_quota') ||
      type.includes('billing_hard_limit_reached')
    );
  }
  const msg = (e.message ?? '').toLowerCase();
  return (
    msg.includes('insufficient_quota') ||
    msg.includes('quota exceeded') ||
    msg.includes('billing')
  );
}

/**
 * Per-1M-token pricing by model. Values are USD as of 2026-05.
 *
 * The previous version hardcoded gpt-4o-mini rates regardless of which model
 * was actually being called — which silently under-reported spend by ~7× when
 * `OPENAI_MODEL=gpt-5.4-mini`. Keep this table in sync with the OpenAI
 * pricing page when adding new models; the fallback uses gpt-4o-mini rates
 * which is *generous* (most models cost more), but at least the log no
 * longer claims you spent $0.69 when you actually spent $5.04.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':   { input: 0.15, output: 0.60 },
  'gpt-4o':        { input: 2.50, output: 10.00 },
  'gpt-4.1':       { input: 2.00, output: 8.00 },
  'gpt-4.1-mini':  { input: 0.40, output: 1.60 },
  'gpt-4.1-nano':  { input: 0.10, output: 0.40 },
  'gpt-5.4-mini':  { input: 1.00, output: 4.00 },
};

function estimateCostUsd(promptTokens: number, completionTokens: number): number {
  const price = MODEL_PRICING[env.openaiModel] ?? MODEL_PRICING['gpt-4o-mini'];
  return (promptTokens * price.input + completionTokens * price.output) / 1_000_000;
}

// ─── Prompt ──────────────────────────────────────────────────────────────
// Lean, instruction-dense. JSON mode forces a structured response so we
// never have to fall back to markdown parsing or regex.
function buildPrompt(o: AirportRow, d: AirportRow): { system: string; user: string } {
  const system = [
    'You are an experienced OTA travel copywriter for FlyMyTicket.com.',
    'You produce SEO-optimized JSON content for flight route pages.',
    'Tone: factual, helpful, specific. Avoid generic filler.',
    'Markdown rules: use **bold** for prices/airline names, ## for section headings inside long fields, plain - bullets for lists. No headings inside hero_md.',
    'India SEO keywords: every page MUST naturally include "cheap flights from <origin> to <destination>" and "cheapest flight from <origin> to <destination>" in the first two FAQ entries (both question AND answer), and once in meta_description.',
    'Return ONLY valid JSON matching the schema. No prose outside JSON.',
  ].join('\n');

  const user = JSON.stringify({
    task: 'Generate route page content',
    origin: {
      iata: o.iata.toUpperCase(),
      city: o.city,
      country: o.country,
      airport: o.name,
    },
    destination: {
      iata: d.iata.toUpperCase(),
      city: d.city,
      country: d.country,
      airport: d.name,
    },
    schema: {
      meta_title: 'string, ~60 chars, lead with "Cheap Flights from X to Y", include FlyMyTicket',
      meta_description: 'string, ~150 chars, include "cheap flights from X to Y" verbatim',
      hero_md: 'string, 2–3 short paragraphs intro (~120 words). Mention airlines, frequencies, fare range, distance. Use **bold** for prices and airline names.',
      history_md: 'string, ~250 words with two ## subheadings. Real history of the route, how it grew, what airlines operate it today.',
      faqs: '6–8 entries. The FIRST TWO must be about "cheap flights from X to Y" and "cheapest flight from X to Y" — both in question and answer.',
      distance_km: 'integer estimate (rounded), null if you cannot reasonably estimate',
      typical_duration_min: 'integer minutes for a direct flight (or shortest connection if no direct exists)',
    },
  });

  return { system, user };
}

// ─── Core generator ──────────────────────────────────────────────────────
export async function generateRouteContent(
  route: RouteRow,
  origin: AirportRow,
  destination: AirportRow,
): Promise<{ content: GeneratedContent; tokens: number; costUsd: number }> {
  const openai = getOpenAI();
  const { system, user } = buildPrompt(origin, destination);

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
  } catch (err) {
    // Re-throw credit-exhausted as a typed error so the batch worker can
    // stop immediately. Any other error bubbles up as-is (will be marked
    // 'failed' for this row and the worker keeps going).
    if (isCreditExhausted(err)) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;
      throw new OpenAiCreditExhaustedError(
        `OpenAI credits exhausted / billing issue: ${msg}`,
        status,
      );
    }
    throw err;
  }

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI returned non-JSON for route ${route.id}: ${raw.slice(0, 200)}`);
  }
  const result = ContentSchema.safeParse(parsed);
  if (!result.success) {
    // Compact, useful error: list each failing field + what we got.
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join(' | ');
    throw new Error(
      `Schema validation failed [${issues}] — raw: ${JSON.stringify(parsed).slice(0, 400)}`,
    );
  }
  const content = result.data;

  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const tokens = promptTokens + completionTokens;
  const costUsd = estimateCostUsd(promptTokens, completionTokens);

  return { content, tokens, costUsd };
}

// ─── Persist + job log ───────────────────────────────────────────────────
/**
 * Generates content for a single route and writes it back to Supabase.
 * Idempotent: re-running on a published route overwrites with fresh
 * content (treat as "regenerate"). Logs every attempt to generation_jobs.
 */
export async function generateAndPersistRoute(route: RouteRow): Promise<{
  ok: boolean;
  costUsd: number;
  error?: string;
}> {
  const supabase = getSupabaseAdmin();

  // Mark in-flight so a second worker doesn't pick the same row.
  await supabase
    .from('routes')
    .update({ status: 'generating' })
    .eq('id', route.id);

  // Hydrate origin + destination airport rows for the prompt.
  const [{ data: origin }, { data: destination }] = await Promise.all([
    supabase.from('airports').select('*').eq('iata', route.origin_iata).maybeSingle(),
    supabase.from('airports').select('*').eq('iata', route.destination_iata).maybeSingle(),
  ]);
  if (!origin || !destination) {
    const msg = `airport rows missing for ${route.origin_iata}->${route.destination_iata}`;
    await logJob(route.id, 'failed', msg, 0, 0);
    await supabase.from('routes').update({ status: 'failed' }).eq('id', route.id);
    return { ok: false, costUsd: 0, error: msg };
  }

  try {
    const { content, tokens, costUsd } = await generateRouteContent(route, origin, destination);

    await supabase
      .from('routes')
      .update({
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        hero_md: content.hero_md,
        history_md: content.history_md,
        faqs: content.faqs as RouteFaq[],
        distance_km: content.distance_km ?? route.distance_km,
        typical_duration_min: content.typical_duration_min ?? route.typical_duration_min,
        status: 'published',
        generated_at: new Date().toISOString(),
        content_version: (route.content_version ?? 1) + 1,
      })
      .eq('id', route.id);

    await logJob(route.id, 'published', null, tokens, costUsd);
    return { ok: true, costUsd };
  } catch (err) {
    // Credit exhaustion: revert this row to 'pending' (it never really failed —
    // we just couldn't pay for it) and bubble up so the batch worker halts.
    if (err instanceof OpenAiCreditExhaustedError) {
      await supabase.from('routes').update({ status: 'pending' }).eq('id', route.id);
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from('routes').update({ status: 'failed' }).eq('id', route.id);
    await logJob(route.id, 'failed', msg, 0, 0);
    return { ok: false, costUsd: 0, error: msg };
  }
}

async function logJob(
  routeId: string,
  status: 'published' | 'failed',
  error: string | null,
  tokens: number,
  costUsd: number,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('generation_jobs').insert({
    route_id: routeId,
    status,
    error,
    tokens_used: tokens,
    cost_usd: costUsd,
    completed_at: new Date().toISOString(),
  });
}
