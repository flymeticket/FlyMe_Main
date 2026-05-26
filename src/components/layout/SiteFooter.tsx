import Link from 'next/link';

// Site-wide footer modelled after Skyscanner / Booking footers — a four-column
// link directory above a single-line bottom bar with region + legal mentions.
// Rendered globally by the (content) layout so every page (home, routes,
// airports, demo) gets the same chrome.

const BRAND_PURPLE = '#A039F0';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us',         href: '/about' },
      { label: 'Careers',          href: '/careers' },
      { label: 'Press',            href: '/press' },
      { label: 'Contact Us',       href: '/contact' },
      { label: 'Partner With Us',  href: '/partners' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Flights',          href: '/demo/mumbai-to-goa' },
      { label: 'Hotels',           href: '/hotels' },
      { label: 'Car Hire',         href: '/cars' },
      { label: 'City Breaks',      href: '#' },
      { label: 'Travel Deals',     href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre',          href: '/help' },
      { label: 'Customer Service',     href: '/contact' },
      { label: 'Manage Bookings',      href: '#' },
      { label: 'Refund Policy',        href: '/refunds' },
      { label: 'Travel Advisories',    href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service',     href: '/terms' },
      { label: 'Privacy Policy',       href: '/privacy' },
      { label: 'Cookies Policy',       href: '/cookies' },
      { label: 'Accessibility',        href: '#' },
      { label: 'Sitemap',              href: '/sitemap-index.xml' },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-bg-contrast text-white">
      {/* ─── Main grid ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            {/* Brand mark — same image as the nav for consistency. h-10
                gives the footer slightly more presence than the navbar. */}
            <Link
              href="/"
              className="inline-flex items-center transition hover:opacity-80"
              aria-label="flymyticket.com — home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/final.png"
                alt="flymyticket.com"
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Compare flights, hotels and cars across 500+ travel partners. One simple search,
              the best price.
            </p>

            {/* Social */}
            <ul className="mt-6 flex items-center gap-3">
              <SocialLink label="Twitter / X"  href="https://twitter.com/flymyticket"  icon={<TwitterIcon />} />
              <SocialLink label="Facebook"     href="https://facebook.com/flymyticket" icon={<FacebookIcon />} />
              <SocialLink label="Instagram"    href="https://instagram.com/flymyticket" icon={<InstagramIcon />} />
              <SocialLink label="LinkedIn"     href="https://linkedin.com/company/flymyticket" icon={<LinkedInIcon />} />
            </ul>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom bar ────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-5 text-xs text-white/60 md:flex-row md:items-center md:px-10">
          <p>
            © {year} FlyMyTicket. All rights reserved. Flight prices shown are sourced from
            partner sites and subject to availability at the time of booking.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>🇮🇳 India · ENG · INR (₹)</span>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms"   className="hover:text-white">Terms</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────

function SocialLink({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        aria-label={label}
        title={label}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-white hover:text-bg-contrast"
      >
        {icon}
      </a>
    </li>
  );
}

function TwitterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.452 20.452h-3.554v-5.568c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.665H9.355V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.114 20.452H3.555V9h3.559zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.978 0 1.778-.773 1.778-1.729V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
}
