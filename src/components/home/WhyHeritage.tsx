import { WorldDotsBackground } from '@/components/home/WorldDotsBackground';

// Trust-builder block — Skyscanner / Yatra have similar "Why us?" sections.
// Four columns of plain copy: no images, no animations, just clean text.
// Subtle dotted world-map watermark sits behind the content as ambient
// "travel-y" texture (same treatment as the rest of the white sections).

const REASONS = [
  {
    title: 'Compare 500+ airlines',
    body:  'One search across every major carrier and dozens of online travel agents — apples to apples, no hidden surcharges.',
  },
  {
    title: 'Real route history',
    body:  'Every flight page is backed by airport histories, terminal guides, and local-transport notes — not just a price.',
  },
  {
    title: 'Best-price guarantee',
    body:  'If you find the same itinerary cheaper elsewhere within 24 hours of booking, we refund the difference.',
  },
  {
    title: '24/7 human support',
    body:  'Real agents reachable by phone, WhatsApp, and email — including same-day re-bookings during disruptions.',
  },
];

export function WhyHeritage() {
  return (
    <section className="relative overflow-hidden bg-bg-soft py-14">
      <WorldDotsBackground className="absolute inset-0 z-0" opacity={0.08} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-bg">
          Why FlyMyTicket
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
          The fastest way to find the best fare.
        </h2>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <div key={r.title}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-bg text-accent-fg">
                <Check />
              </div>
              <h3 className="text-lg font-bold text-fg">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
