import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/ComingSoon';

export const metadata: Metadata = {
  title: 'Cars · Coming soon — FlyMyTicket',
  description:
    'Car hire search is on the way. We’re working on a comparison surface that covers airport rentals across major providers worldwide.',
  robots: { index: false, follow: true },
};

export default function CarsPage() {
  return (
    <ComingSoon
      icon={<CarIcon />}
      eyebrow="Car hire"
      title="FlyMyTicket Wheels is in the workshop."
      description="Airport car rentals across every major provider — Hertz, Avis, Enterprise, local specialists — compared in one search. We’ll layer it on top of the flight + hotel platform once those are stable."
      primaryCta={{ label: 'Search flights instead', href: '/' }}
      secondaryCta={{ label: 'See sample route', href: '/demo/mumbai-to-goa' }}
    />
  );
}

function CarIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17h14" />
      <path d="M5 17v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3" />
      <path d="M19 17v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3" />
      <path d="M3 17v-4l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3z" />
      <circle cx="7" cy="14" r="1" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  );
}
