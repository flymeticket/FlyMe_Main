import Link from 'next/link';

// Sticky top navigation shared by every content page including the home.
// Brand: solid FlyMyTicket blue (#1B1FE3), white wordmark with the purple
// .com accent over ".com", utility links on the right.

const BRAND_PURPLE = '#A039F0';

const NAV_LINKS = [
  { label: 'Flights', href: '/demo/mumbai-to-goa' },  // TODO: dedicated /flights index
  { label: 'Hotels',  href: '/hotels' },
  { label: 'Cars',    href: '/cars' },
  { label: 'Help',    href: '#' },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 bg-bg-contrast text-white shadow-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-6 px-6 md:px-10">
        {/* Brand mark — /public/fly_my_tic_logo.png. Logo fills almost the
            entire h-14 nav (h-12 ≈ 48px in a 56px container) — much larger
            than the original h-9 without touching the nav height. */}
        <Link
          href="/"
          className="inline-flex items-center transition hover:opacity-90"
          aria-label="flymyticket.com — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/final.png"
            alt="flymyticket.com"
            className="h-6 w-auto"
          />
        </Link>

        {/* Center utility links — visible on md+ */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/90 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster: language, theme, login */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Region: India"
            title="Region: India"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10 md:inline-flex"
          >
            <GlobeIcon />
          </button>
          <Link
            href="#"
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-bg-contrast transition hover:bg-white/90"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}

function PlaneLogo() {
  // Simple plane mark — placeholder for a real FlyMyTicket logo asset.
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}
