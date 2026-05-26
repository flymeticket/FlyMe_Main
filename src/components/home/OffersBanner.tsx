import { WorldDotsBackground } from '@/components/home/WorldDotsBackground';

// Three promo cards under the hero. Static placeholders today — once a real
// CMS / partner-deals API lands, this becomes data-driven.
// Wrapped in a full-width `relative overflow-hidden` section so the same
// subtle dotted world map can sit behind the cards.

interface Offer {
  title: string;
  body: string;
  badge: string;
  bg: string; // Tailwind class for the corner tint
}

const OFFERS: Offer[] = [
  {
    title: 'Up to ₹1,800 off',
    body:    'HSBC credit cards on international return flights.',
    badge:   'HSBC',
    bg:      'from-[#0062E3]/10 to-transparent',
  },
  {
    title: 'Up to ₹2,026 off',
    body:    'SBI Card holders on domestic bookings over ₹15,000.',
    badge:   'SBI',
    bg:      'from-amber-500/10 to-transparent',
  },
  {
    title: 'Up to ₹3,000 off',
    body:    'Amex Platinum on premium-cabin international fares.',
    badge:   'AMEX',
    bg:      'from-emerald-500/10 to-transparent',
  },
];

export function OffersBanner() {
  return (
    <section className="relative overflow-hidden bg-white">
      <WorldDotsBackground className="absolute inset-0 z-0" opacity={0.08} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:px-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
          Special offers
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-accent-bg hover:underline"
        >
          View all offers →
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {OFFERS.map((o) => (
          <div
            key={o.badge}
            className={`relative overflow-hidden rounded-md border border-border-token bg-bg-soft p-5 bg-gradient-to-br ${o.bg}`}
          >
            <span className="inline-block rounded-full bg-bg-contrast px-2.5 py-1 text-xs font-bold tracking-widest text-fg-on-contrast">
              {o.badge}
            </span>
            <p className="mt-4 text-xl font-bold leading-tight text-fg">
              {o.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {o.body}
            </p>
            <a
              href="#"
              className="mt-4 inline-block text-xs font-semibold uppercase tracking-widest text-accent-bg hover:underline"
            >
              View details
            </a>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
