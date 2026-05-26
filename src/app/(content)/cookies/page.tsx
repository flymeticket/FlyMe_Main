import type { Metadata } from 'next';
import { LegalShell } from '../legal/LegalShell';

export const metadata: Metadata = {
  title: 'Cookies Policy · FlyMyTicket',
  description: 'How FlyMyTicket uses cookies and similar tracking technologies, and how to control them.',
};

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookies Policy"
      subtitle="Cookies, why we use them, and how to control them in your browser."
      lastUpdatedISO="2026-05-21"
    >
      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files stored on your device by your browser. We also use similar technologies such as
        localStorage and pixel beacons. Collectively, we refer to all of these as &ldquo;cookies&rdquo; in this policy.
      </p>

      <h2>2. The cookies we use</h2>
      <table>
        <thead>
          <tr><th>Category</th><th>Purpose</th><th>Examples</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Strictly necessary</td>
            <td>Keep the site working — load balancing, authentication.</td>
            <td>session_id, csrf_token</td>
          </tr>
          <tr>
            <td>Functional</td>
            <td>Remember your preferences (region, language, recent searches).</td>
            <td>fm_locale, fm_recent</td>
          </tr>
          <tr>
            <td>Analytics</td>
            <td>Aggregate, anonymous usage measurement.</td>
            <td>_ga, _gid</td>
          </tr>
          <tr>
            <td>Marketing</td>
            <td>Measure the performance of campaigns; only if you opt-in.</td>
            <td>fbp, _fbc</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Your choices</h2>
      <ul>
        <li>Use our cookie banner to consent or reject non-essential categories.</li>
        <li>Clear cookies via your browser settings at any time.</li>
        <li>Opt out of personalised advertising via <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">YourOnlineChoices</a>.</li>
      </ul>

      <h2>4. Third-party cookies</h2>
      <p>
        Partners may set their own cookies when you click through to their site; their privacy and cookies policies
        apply on those pages.
      </p>

      <h2>5. Updates</h2>
      <p>
        We may update this policy as the cookies we use change. Material changes will be reflected on this page with
        an updated &ldquo;Last updated&rdquo; date.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies: <a href="mailto:privacy@flymyticket.com">privacy@flymyticket.com</a>.
      </p>

      <hr />
      <p className="text-sm text-fg-muted">
        <strong>Placeholder notice:</strong> this draft is a structural skeleton — the binding version
        must be reviewed and signed off by qualified legal counsel before launch.
      </p>
    </LegalShell>
  );
}
