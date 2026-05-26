import type { RouteFaq } from '@/lib/database.types';

export function FAQs({ faqs }: { faqs: RouteFaq[] }) {
  if (!faqs.length) return null;
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold tracking-tight text-fg">Frequently asked questions</h2>
      <dl className="mt-6 divide-y divide-[color:var(--color-border-token)] border-y border-border-token">
        {faqs.map((faq, idx) => (
          <details key={idx} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <dt className="text-base font-semibold text-fg">{faq.q}</dt>
              <span
                className="text-xl font-light transition group-open:rotate-45"
                style={{ color: '#1B1FE3' }}
              >
                +
              </span>
            </summary>
            <dd className="mt-3 leading-relaxed text-fg-muted">{faq.a}</dd>
          </details>
        ))}
      </dl>
    </section>
  );
}

// Schema.org FAQPage JSON-LD — emitted alongside the visual block so search
// engines can build rich results.
export function FAQSchema({ faqs }: { faqs: RouteFaq[] }) {
  if (!faqs.length) return null;
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
