import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/ComingSoon';

export const metadata: Metadata = {
  title: 'Hotels · Coming soon — FlyMyTicket',
  description:
    'FlyMyTicket Stays is on the way. We’re partnering with Booking.com to bring you hotel search at the same depth as our flight content.',
  robots: { index: false, follow: true },
};

export default function HotelsPage() {
  return (
    <ComingSoon
      icon={<HotelIcon />}
      eyebrow="Stays"
      title="FlyMyTicket Stays is on the way."
      description="We’re building hotel search with the same obsession we put into flights — every property reviewed, every neighbourhood mapped, every price compared across providers. Booking.com integration goes live in the next phase."
      primaryCta={{ label: 'Search flights instead', href: '/' }}
      secondaryCta={{ label: 'See sample route', href: '/demo/mumbai-to-goa' }}
    />
  );
}

function HotelIcon() {
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
      <path d="M3 21V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13" />
      <path d="M3 21h18" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M9 8v0M15 8v0" />
    </svg>
  );
}
