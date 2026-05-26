// Shared chrome for legal placeholder pages (privacy / terms / cookies /
// refunds). One column, comfortable reading width, last-updated stamp.
//
// These are intentionally placeholder skeletons — real T&C / privacy text
// needs a lawyer pass before launch. The structure mirrors what a typical
// OTA presents so it's drop-in ready when the legal copy arrives.

interface Props {
  title: string;
  subtitle?: string;
  lastUpdatedISO: string;
  children: React.ReactNode;
}

export function LegalShell({ title, subtitle, lastUpdatedISO, children }: Props) {
  const lastUpdated = new Date(lastUpdatedISO).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <nav className="mb-6 text-xs uppercase tracking-widest text-fg-muted">
        <a href="/" className="hover:text-fg">Home</a> / Legal / {title}
      </nav>
      <header className="border-b border-border-token pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-fg-muted">{subtitle}</p>}
        <p className="mt-3 text-xs uppercase tracking-widest text-fg-muted">
          Last updated: {lastUpdated}
        </p>
      </header>
      <article className="prose prose-neutral mt-8 max-w-none text-fg">
        {children}
      </article>
    </main>
  );
}
