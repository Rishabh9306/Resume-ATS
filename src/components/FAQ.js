'use client';

import { useState } from 'react';

const faqData = [
  { q: 'What is an ATS?', a: 'An Applicant Tracking System (ATS) is software used by 99% of Fortune 500 companies and most recruiters to automatically filter resumes before a human ever sees them. If your resume isn\'t ATS-compatible, it gets rejected — even if you\'re perfectly qualified.' },
  { q: 'How does the scoring work?', a: 'We analyze your resume across 6 weighted criteria: Keyword Match (30%), Section Completeness (20%), ATS Formatting (15%), Impact Metrics (15%), Length & Density (10%), and ATS Compatibility (10%). Each criterion is scored 0-100 and combined into your overall ATS score.' },
  { q: 'Can I use it for free?', a: 'Yes! Our free tier gives you 3 scans per month with a basic ATS score and keyword analysis. No credit card required. Upgrade to Starter (₹299/mo) or Pro (₹699/mo) for AI-powered rewrite suggestions, unlimited scans, and detailed breakdowns.' },
  { q: 'What file formats are supported?', a: 'We support PDF and DOCX (Microsoft Word) files up to 5MB. These are the two most common resume formats. We recommend PDF for the most consistent ATS parsing results.' },
  { q: 'How is my data handled?', a: 'Your resume data is processed securely and stored encrypted in our database. We never share your personal information with third parties. You can delete your account and all associated data at any time from your settings page.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time from your billing page. Your access continues until the end of your current billing period. No cancellation fees, no questions asked.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="section-padding">
      <div className="container">
        <div className="section-heading">
          <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
          <p>Everything you need to know about ResumeATS Pro.</p>
        </div>
        <div className="faq__list">
          {faqData.map((item, i) => (
            <div key={i} className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}>
              <button className="faq-item__trigger" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span>{item.q}</span>
                <span className="faq-item__icon">+</span>
              </button>
              <div className="faq-item__content">
                <div className="faq-item__answer">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
