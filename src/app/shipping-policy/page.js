import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Shipping & Delivery Policy - ResumeATS',
  description: 'Shipping and Delivery policy for digital SaaS services on ResumeATS.',
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Shipping & Delivery Policy</h1>
            <p className="legal-subtitle">Last Updated: June 6, 2026</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>1. Digital Delivery of Services</h2>
              <p>
                ResumeATS is a digital Software-as-a-Service (SaaS) platform providing AI-powered resume scoring, compatibility reports, and keyword optimization tools. 
              </p>
              <p>
                <strong>No physical products are sold, shipped, or delivered.</strong>
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Service Activation & Delivery Timeline</h2>
              <p>
                Upon successful payment processing and verification through our gateway partner (Razorpay):
              </p>
              <ul>
                <li>Your selected subscription plan (Pro, Teams, or Enterprise) is activated instantly.</li>
                <li>Your account quota (such as resume scans and AI rewrite credits) is updated immediately in our system database.</li>
                <li>You will receive an automated payment confirmation email from Razorpay and an invoice to your registered email address.</li>
              </ul>
              <p>
                Under normal operating conditions, delivery is <strong>immediate</strong> (within seconds of transaction approval).
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Shipping Charges</h2>
              <p>
                Since all services are delivered electronically via our online portal, there are <strong>zero shipping charges, packaging fees, or delivery tariffs</strong> associated with any of our subscription plans.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Exchanges and Returns</h2>
              <p>
                Because our services are fully digital and intangible, we do not support product returns or physical exchanges. If you are unsatisfied with the service or upgraded in error, please refer to our <a href="/refund-policy" className="gradient-text">Refund & Cancellation Policy</a> to see if you are eligible to request a refund.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Access Issues & Support</h2>
              <p>
                If your account status fails to update automatically after making a payment, or if you face technical issues accessing your paid features, please contact us immediately:
              </p>
              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Technical Support</div>
                  <div className="legal-contact-value">gupta.rishabh0406@gmail.com</div>
                </div>
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Operating / Registered Address</div>
                  <div className="legal-contact-value">Noida, Uttar Pradesh, 201301, India</div>
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
