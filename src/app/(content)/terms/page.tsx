import type { Metadata } from 'next';
import { LegalShell } from '../legal/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Service · FlyMyTicket',
  description: 'The terms governing your use of FlyMyTicket — bookings, payments, refunds, and liability.',
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="The agreement between you and FlyMyTicket when using this site or any service we provide."
      lastUpdatedISO="2026-05-21"
    >
      <h2>1. Acceptance of terms</h2>
      <p>
        By accessing or using FlyMyTicket (the &ldquo;Service&rdquo;) you agree to be bound by these Terms of Service.
        If you do not agree, you may not use the Service.
      </p>

      <h2>2. The Service</h2>
      <p>
        FlyMyTicket is a price-comparison platform. We surface fares, hotel rates, and car-hire deals from third-party
        suppliers (the &ldquo;Partners&rdquo;). When you make a booking, your contract is with the Partner, not with FlyMyTicket.
        We are not the seller or operator of the underlying travel service.
      </p>

      <h2>3. Pricing &amp; availability</h2>
      <p>
        Prices shown are sourced from Partners and refreshed periodically. They are indicative until you complete a
        booking on the Partner&rsquo;s site, at which point the Partner&rsquo;s final price applies. We do our best to keep listings
        accurate but make no warranty about availability, fare class, baggage allowance, or schedule.
      </p>

      <h2>4. Bookings, changes &amp; cancellations</h2>
      <p>
        All booking, change, and cancellation policies are set by the Partner. Please read their conditions before
        confirming. FlyMyTicket cannot modify or cancel a booking on the Partner&rsquo;s behalf.
      </p>

      <h2>5. Your account</h2>
      <p>
        You are responsible for keeping any account credentials confidential and for activity under your account.
        We may suspend or terminate accounts used in violation of these terms or applicable law.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>scrape, mirror, or republish content without our written consent;</li>
        <li>use bots, scripts, or rate-limit-defeating tooling against the Service;</li>
        <li>misrepresent your identity or interfere with the Service&rsquo;s operation.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        The FlyMyTicket name, logo, layout, copy, and aggregated route data are owned by FlyMyTicket or its
        licensors. Partner trademarks are the property of their respective owners.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, FlyMyTicket is not liable for any indirect, incidental, special,
        consequential, or punitive damages arising from your use of the Service or any booking made via a Partner.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction
        of the courts in Bengaluru, Karnataka.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be communicated via this page; continued
        use of the Service constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? Email <a href="mailto:legal@flymyticket.com">legal@flymyticket.com</a>.
      </p>

      <hr />
      <p className="text-sm text-fg-muted">
        <strong>Placeholder notice:</strong> this draft is a structural skeleton — the binding version
        must be reviewed and signed off by qualified legal counsel before launch.
      </p>
    </LegalShell>
  );
}
