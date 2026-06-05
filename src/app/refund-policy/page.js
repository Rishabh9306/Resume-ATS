import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Refund Policy - ResumeATS',
  description: 'Refund policy, terms of refund and processing times for ResumeATS.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Refund & Cancellation Policy</h1>
            <p className="legal-subtitle">Last Updated: June 6, 2026</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>1. Subscription Gating and Access</h2>
              <p>
                ResumeATS offers monthly paid subscription tiers (Pro, Teams, Enterprise) that grant immediate, high-priority access to our AI features, templates, custom analysis models, and unlimited scans. These services consume cloud computing and commercial artificial intelligence API resources in real time upon activation.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Cancellation Policy</h2>
              <p>
                You may cancel your paid subscription at any time. 
              </p>
              <ul>
                <li><strong>How to Cancel:</strong> You can initiate cancellation through your account dashboard by navigating to <em>Settings &gt; Billing</em> and clicking "Cancel Subscription", or by contacting our support team at <a href="mailto:gupta.rishabh0406@gmail.com" className="gradient-text">gupta.rishabh0406@gmail.com</a>.</li>
                <li><strong>Effective Date:</strong> Cancellations will take effect at the end of the current billing cycle. You will retain full access to all features associated with your paid plan until your current billing period expires.</li>
                <li><strong>No Auto-Renewal:</strong> Once canceled, your card or payment account will not be charged again at the next renewal date. Your account will automatically downgrade to the Free tier at the end of the active billing cycle.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Refund Policy</h2>
              <p>
                Due to the immediate provisioning of AI computing credits and document parsing resources, our general policy is that all sales are final and subscription fees are non-refundable. 
              </p>
              <p>
                However, we value our customers and will evaluate refund requests under the following conditions:
              </p>
              <ul>
                <li><strong>48-Hour Refund Window:</strong> If you purchased a subscription in error or are unsatisfied with the service, you can request a refund within **48 hours** of the initial transaction, provided that you have consumed **1 scan or fewer** during that period.</li>
                <li><strong>Technical Defect:</strong> If the service experiences a prolonged outage (greater than 24 hours) or a critical system error prevents you from utilizing your purchased scans, we will issue a prorated refund or extend your billing period.</li>
                <li><strong>Duplicate Billing:</strong> In the event of an accidental double charge or billing system error, we will immediately refund the duplicate transaction.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Refund Processing Time</h2>
              <p>
                Once a refund is approved by our support team:
              </p>
              <ul>
                <li>The transaction will be initiated back to your original payment source (credit card, debit card, UPI, or Net Banking).</li>
                <li>Refunds are processed through our payment gateway provider, Razorpay.</li>
                <li>It typically takes <strong>5 to 7 business days</strong> for the refunded amount to reflect in your bank account or payment method statements, depending on your financial institution.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Contact Support</h2>
              <p>
                To request a refund or raise a billing inquiry, please email us with your registered account email and transaction ID:
              </p>
              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Billing Support</div>
                  <div className="legal-contact-value">gupta.rishabh0406@gmail.com</div>
                </div>
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Response Time</div>
                  <div className="legal-contact-value">Within 24-48 Hours</div>
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
