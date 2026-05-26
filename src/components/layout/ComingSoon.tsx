import Link from 'next/link';
import type { ReactNode } from 'react';

// Reusable "Coming soon" placeholder for product surfaces that aren't built
// yet (Hotels, Cars, …). Keeps the navbar + footer in place via the parent
// (content) layout — only the body slot is themed.
//
// Usage:
//   <ComingSoon
//     icon={<HotelIcon />}
//     eyebrow="Stays"
//     title="Heritage Stays is on the way."
//     description="…"
//     primaryCta={{ label: 'Search flights instead', href: '/' }}
//   />

interface CtaLink {
  label: string;
  href: string;
}

interface Props {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
}

export function ComingSoon({
  icon,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: Props) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-6 py-16 md:px-10">
      <div className="rounded-md border border-border-token bg-bg-soft p-8 md:p-12">
        {icon && (
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg-contrast text-fg-on-contrast">
            {icon}
          </div>
        )}

        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.3em] text-accent-bg">
            {eyebrow} · Coming soon
          </p>
        )}

        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg md:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted md:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {primaryCta && (
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-md bg-accent-bg px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
            >
              {primaryCta.label}
            </Link>
          )}
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-md border border-border-strong px-6 py-3 text-sm font-semibold text-fg transition hover:bg-bg"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>

        <p className="mt-10 text-xs text-fg-muted">
          We&rsquo;re focused on building the world&rsquo;s most comprehensive flight search first.
          Once that&rsquo;s in flight, this surface unlocks next.
        </p>
      </div>
    </main>
  );
}
