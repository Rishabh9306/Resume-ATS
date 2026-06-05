import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service - ResumeATS',
  description: 'Terms of Service and usage agreements for ResumeATS.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-subtitle">Last Updated: June 6, 2026</p>
          </div>

          <div className="legal-card">
            <section className="legal-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                Welcome to ResumeATS ("we," "us," or "our"). By accessing or using our website located at{' '}
                <a href="https://resume-ats-rho.vercel.app/" className="gradient-text">
                  https://resume-ats-rho.vercel.app/
                </a>{' '}
                and our resume analysis services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Description of Service</h2>
              <p>
                ResumeATS provides AI-powered resume analysis, ATS scoring, and keyword optimization tools designed to assist job seekers in optimizing their resumes for Applicant Tracking Systems. 
              </p>
              <p>
                Services are available under free and paid subscription models. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Accounts and Registration</h2>
              <p>
                To access certain features of the service, you may be required to register for an account and authenticate using Google Sign-In or email/password. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security of your account and credentials.</li>
                <li>Promptly notify us if you discover or suspect any unauthorized access or breach of security.</li>
                <li>Take full responsibility for all activities that occur under your account.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Subscription Tiers & Payment</h2>
              <p>
                We offer subscription plans (Pro, Teams, and Enterprise) as detailed on our website.
              </p>
              <ul>
                <li><strong>Billing:</strong> Payments are processed securely via our payment gateway partner, Razorpay. All transactions are subject to their terms and privacy policies.</li>
                <li><strong>Pricing:</strong> Pricing is displayed in Indian Rupees (INR) and is subject to change. Any price changes will be communicated in advance.</li>
                <li><strong>Subscription Period:</strong> Paid subscriptions run on a monthly billing cycle and renew automatically unless canceled in writing or via the user dashboard settings.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. User Conduct & Acceptable Use</h2>
              <p>
                You agree not to use the service to upload any content that is unlawful, harmful, offensive, or violates third-party intellectual property rights. You agree not to:
              </p>
              <ul>
                <li>Attempt to bypass, disable, or circumvent any security measures or rate limits of the system.</li>
                <li>Use automated scripts or scraping tools to extract data or bulk scan resumes outside of the provided API limits.</li>
                <li>Resell, lease, or distribute our service or API keys without explicit written permission.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Intellectual Property</h2>
              <p>
                All content, logos, designs, databases, and software on ResumeATS are the intellectual property of ResumeATS (operated by Rishabh Gupta) and are protected by copyright, trademark, and other laws of India. You are granted a limited, non-exclusive, non-transferable license to access and use our service for personal or internal business purposes.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ResumeATS and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Governing Law & Jurisdiction</h2>
              <p>
                These Terms of Service and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of India. Any legal action or proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Delhi/NCR, India.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding these Terms, please contact us at:
              </p>
              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <div className="legal-contact-label">Email Support</div>
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
