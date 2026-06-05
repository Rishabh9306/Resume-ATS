import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cancellation Policy - ResumeATS',
  description: 'Subscription cancellation instructions and terms for ResumeATS.',
};

export default function CancellationPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Cancellation Policy</h1>
            <p className="legal-subtitle">Last Updated: June 6, 2026</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>1. Subscription Model</h2>
              <p>
                ResumeATS provides monthly auto-renewing subscriptions (Pro, Teams, and Enterprise) billed at the start of each subscription term. You are billed automatically on a recurring monthly schedule using the payment credentials provided during your initial upgrade.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. How to Cancel Your Subscription</h2>
              <p>
                You have the right to cancel your paid subscription at any time. No prior notice is required, and there are no cancellation fees.
              </p>
              <p>
                You can cancel your subscription using either of the following methods:
              </p>
              <ul>
                <li><strong>Self-Service Cancellation:</strong> Log in to your ResumeATS account, open the dashboard sidebar, navigate to <em>Settings &gt; Billing</em>, and click the "Cancel Subscription" button. Your status will update instantly.</li>
                <li><strong>Email Request:</strong> Send an email from your registered account address to <a href="mailto:gupta.rishabh0406@gmail.com" className="gradient-text">gupta.rishabh0406@gmail.com</a> requesting subscription cancellation. Please allow up to 24-48 hours for manual processing.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Gating and Feature Retainment</h2>
              <p>
                Upon canceling your subscription:
              </p>
              <ul>
                <li>Your paid features and scan limits will remain fully active until the end of your current paid billing period.</li>
                <li>At the end of your billing cycle, your account will automatically downgrade to the Free tier.</li>
                <li>No further charges will be made to your payment card or account.</li>
                <li>Any data, resume history, and custom settings will remain saved on your profile under the Free tier rules unless you request account deletion.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Refunds on Cancellation</h2>
              <p>
                Canceling a subscription prevents future renewals but does not trigger automatic refunds for the current billing cycle. To see if you qualify for a refund under our 48-hour signup/renewal grace period, please refer to our full <a href="/refund-policy" className="gradient-text">Refund Policy</a>.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Contact Support</h2>
              <p>
                If you encounter any technical issues or need assistance canceling your billing, contact us:
              </p>
              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Billing Support</div>
                  <div className="legal-contact-value">gupta.rishabh0406@gmail.com</div>
                </div>
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Merchant Name</div>
                  <div className="legal-contact-value">Rishabh Gupta</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
