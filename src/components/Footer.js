'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Footer() {
  const { userData } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenSupport = (e, tab) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-support-widget', { detail: { tab } }));
  };

  const isPaid = mounted && userData?.plan && userData.plan !== 'free';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="gradient-text">ResumeATS</span>
              {isPaid && <span className="navbar__logo-badge">Pro</span>}
            </div>
            <p className="footer__brand-desc">AI-powered resume optimization for the modern job seeker. Beat the ATS, land more interviews.</p>
          </div>
          <div className="footer__column">
            <h4 className="footer__column-title">Product</h4>
            <div className="footer__links">
              <Link href="/#features" className="footer__link">Features</Link>
              <Link href="/#pricing" className="footer__link">Pricing</Link>
              <Link href="/#faq" className="footer__link">FAQ</Link>
            </div>
          </div>
          <div className="footer__column">
            <h4 className="footer__column-title">Resources</h4>
            <div className="footer__links">
              <Link href="#" className="footer__link">Resume Tips</Link>
              <Link href="#" className="footer__link">ATS Guide</Link>
              <Link href="#" className="footer__link">Blog</Link>
            </div>
          </div>
          <div className="footer__column">
            <h4 className="footer__column-title">Support</h4>
            <div className="footer__links">
              <a href="#" onClick={(e) => handleOpenSupport(e, 'support')} className="footer__link">Help Center</a>
              <a href="mailto:gupta.rishabh0406@gmail.com" className="footer__link">Email Us</a>
              <a href="#" onClick={(e) => handleOpenSupport(e, 'feedback')} className="footer__link">Send Feedback</a>
              <a href="#" onClick={(e) => handleOpenSupport(e, 'bug')} className="footer__link">Report a Bug</a>
            </div>
          </div>
          <div className="footer__column">
            <h4 className="footer__column-title">Legal</h4>
            <div className="footer__links">
              <Link href="#" className="footer__link">Privacy Policy</Link>
              <Link href="#" className="footer__link">Terms of Service</Link>
              <Link href="#" className="footer__link">Refund Policy</Link>
              <Link href="#" className="footer__link">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 ResumeATS{isPaid ? ' Pro' : ''}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
