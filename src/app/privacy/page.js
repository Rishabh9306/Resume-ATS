import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy - ResumeATS',
  description: 'Privacy Policy and data safety rules for ResumeATS.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-subtitle">Last Updated: June 6, 2026</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                ResumeATS ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at{' '}
                <a href="https://resume-ats-rho.vercel.app/" className="gradient-text">
                  https://resume-ats-rho.vercel.app/
                </a>{' '}
                and use our AI-powered resume analysis services.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect information that you voluntarily provide to us and some data automatically.
              </p>
              <ul>
                <li><strong>Account Data:</strong> When you log in, we collect your email address, profile picture, and user name. This authentication is handled securely via Firebase Auth.</li>
                <li><strong>Resume & Job Data:</strong> We collect the resume documents (PDF/DOCX) you upload and the job descriptions you enter to perform analysis.</li>
                <li><strong>Payment Information:</strong> We do not store credit card numbers or other payment credentials on our servers. All subscription payments are processed securely through our gateway provider, Razorpay. Razorpay collects and processes payment information in accordance with their privacy standards.</li>
                <li><strong>Usage Data:</strong> We may collect diagnostic and performance logs, including browser type, operating system, and feature access metrics, to help debug and optimize our service.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>
                We use the collected information for the following business purposes:
              </p>
              <ul>
                <li>To provide and maintain our resume scoring, keywords matching, and suggestions service.</li>
                <li>To process subscription payments and manage invoices.</li>
                <li>To verify your account usage against subscription tier limits (e.g., counting monthly scans).</li>
                <li>To respond to support requests, bug reports, and user feedback.</li>
                <li>To protect the security of our application and prevent fraud.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Sharing and Disclosure</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service providers essential to operating our business:
              </p>
              <ul>
                <li><strong>Google Cloud & Firebase:</strong> For user authentication, cloud database storage, and hosting.</li>
                <li><strong>Google Generative AI (Gemini):</strong> Resume text and job descriptions are sent via API to Google Gemini models to generate optimization suggestions. This text is processed programmatically and is not used to train the underlying models.</li>
                <li><strong>Razorpay:</strong> To process your payment transactions securely.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Data Security & Retention</h2>
              <p>
                We implement robust security measures to protect your account details and uploaded documents. Uploaded resumes are processed temporarily for analysis and stored securely. You can delete your scans or account at any time. We retain payment-related logs for standard tax, legal, and gateway compliance purposes as required by Indian law.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Cookies and Tracking</h2>
              <p>
                We use secure authentication cookies to keep you signed into the dashboard. We do not use third-party advertising trackers or behavioral targeting pixels.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Children's Privacy</h2>
              <p>
                Our services are not designed for or targeted at children under the age of 13. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Changes to this Policy</h2>
              <p>
                We reserve the right to update this Privacy Policy. We will notify users of any significant changes by updating the "Last Updated" date at the top of this page. Your continued use of the service after modifications constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Contact Us</h2>
              <p>
                If you have questions about our privacy practices, data deletion requests, or concerns, please contact us at:
              </p>
              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Email Support</div>
                  <div className="legal-contact-value">gupta.rishabh0406@gmail.com</div>
                </div>
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Data Officer</div>
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
