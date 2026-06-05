import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact Us - ResumeATS',
  description: 'Get in touch with the ResumeATS support team for inquiries, feedback, and billing issues.',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Contact Us</h1>
            <p className="legal-subtitle">We are here to help. Reach out with any questions or support requests.</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>Support Channels</h2>
              <p>
                Whether you have technical questions about your ATS resume analysis, need help managing your subscription, or want to submit feedback, we aim to respond to all inquiries within <strong>24 to 48 hours</strong>.
              </p>
            </section>

            <section className="legal-section">
              <h2>Merchant & Contact Information</h2>
              <p>
                In compliance with payment gateway guidelines, here are our official registered merchant and support details:
              </p>

              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Merchant Name</div>
                  <div className="legal-contact-value">Rishabh Gupta</div>
                </div>

                <div className="legal-contact-item">
                  <div className="legal-contact-label">Customer Support Email</div>
                  <div className="legal-contact-value">
                    <a href="mailto:gupta.rishabh0406@gmail.com" className="gradient-text">
                      gupta.rishabh0406@gmail.com
                    </a>
                  </div>
                </div>

                <div className="legal-contact-item">
                  <div className="legal-contact-label">Operating / Registered Address</div>
                  <div className="legal-contact-value">
                    Noida, Uttar Pradesh, 201301, India
                  </div>
                </div>

                <div className="legal-contact-item">
                  <div className="legal-contact-label">Support Hours</div>
                  <div className="legal-contact-value">10:00 AM - 6:00 PM IST (Mon - Fri)</div>
                </div>
              </div>
            </section>

            <section className="legal-section" style={{ marginTop: 'var(--space-xl)' }}>
              <h2>Billing & Payments</h2>
              <p>
                All billing activities, subscription upgrades, and transactions are processed securely via our payment gateway partner, Razorpay. If you have inquiries about a specific charge or transaction, please include your **Razorpay Payment ID** or **Subscription ID** in your email for faster resolution.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
