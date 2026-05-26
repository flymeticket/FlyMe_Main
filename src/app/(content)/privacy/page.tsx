import type { Metadata } from 'next';
import { LegalShell } from '../legal/LegalShell';

export const metadata: Metadata = {
  title: 'Privacy Policy · FlyMyTicket',
  description: 'How FlyMyTicket collects, uses, stores, and shares the personal information you provide.',
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and the choices you have."
      lastUpdatedISO="2026-05-21"
    >
      <h2>1. Who we are</h2>
      <p>
        FlyMyTicket (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates flymyticket.com. We are the data controller for the personal
        information you provide directly on our site.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Search data</strong> — origin, destination, dates, passenger count, cabin class.</li>
        <li><strong>Device data</strong> — IP address, browser, OS, referring URL (via standard server logs).</li>
        <li><strong>Account data</strong> — name, email, password hash if you create an account.</li>
        <li><strong>Cookies &amp; analytics</strong> — see our <a href="/cookies">Cookies Policy</a>.</li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To complete searches and pre-fill booking forms on Partner sites.</li>
        <li>To analyse aggregate trends and improve the Service.</li>
        <li>To prevent fraud, abuse, and security incidents.</li>
        <li>To send transactional emails you have opted in to receive.</li>
      </ul>

      <h2>4. Who we share it with</h2>
      <p>
        When you click through to a Partner, the URL parameters of your search (origin, destination, dates) are
        passed to that Partner so they can show matching results. We do not sell your personal data to third parties.
        We may share data with service providers (hosting, analytics, payment processors) bound by confidentiality
        obligations.
      </p>

      <h2>5. Your rights</h2>
      <p>Under applicable law (including the Indian DPDP Act, GDPR where relevant) you may:</p>
      <ul>
        <li>request a copy of the data we hold about you;</li>
        <li>ask us to correct or delete inaccurate data;</li>
        <li>withdraw consent for marketing communications at any time;</li>
        <li>lodge a complaint with the relevant data-protection authority.</li>
      </ul>

      <h2>6. Data retention</h2>
      <p>
        We retain search and log data for up to 13 months for analytics and fraud-prevention. Account data is kept
        until you delete your account, plus a 30-day grace period.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Some of our service providers operate outside India. When data is transferred internationally, we rely on
        standard contractual clauses or equivalent safeguards.
      </p>

      <h2>8. Security</h2>
      <p>
        We use TLS for all traffic, encrypt sensitive data at rest, and limit internal access on a need-to-know
        basis. No system is impenetrable; if we discover a breach affecting your data we will notify you in line
        with applicable law.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not directed to children under 18. We do not knowingly collect data from minors.
      </p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions or requests: <a href="mailto:privacy@flymyticket.com">privacy@flymyticket.com</a>.
      </p>

      <hr />
      <p className="text-sm text-fg-muted">
        <strong>Placeholder notice:</strong> this draft is a structural skeleton — the binding version
        must be reviewed and signed off by qualified legal counsel before launch.
      </p>
    </LegalShell>
  );
}
