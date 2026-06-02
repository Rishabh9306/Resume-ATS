'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, userData } = useAuth();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--solid' : 'navbar--transparent'}`}>
      <div className="navbar__inner">
        <Link href="/" className="navbar__logo">
          <span className="gradient-text">ResumeATS</span>
          {mounted && userData?.plan && userData.plan !== 'free' && (
            <span className="navbar__logo-badge">Pro</span>
          )}
        </Link>

        <div className="navbar__links">
          <button className="navbar__link" onClick={() => scrollToSection('features')}>Features</button>
          <button className="navbar__link" onClick={() => scrollToSection('pricing')}>Pricing</button>
          <button className="navbar__link" onClick={() => scrollToSection('faq')}>FAQ</button>
        </div>

        <div className="navbar__actions">
          {mounted && user ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/login" className="btn-primary">Get Started Free</Link>
            </>
          )}
        </div>

        <button
          className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div className={`navbar__mobile-menu ${menuOpen ? 'navbar__mobile-menu--open' : ''}`}>
        <button className="navbar__mobile-link" onClick={() => scrollToSection('features')}>Features</button>
        <button className="navbar__mobile-link" onClick={() => scrollToSection('pricing')}>Pricing</button>
        <button className="navbar__mobile-link" onClick={() => scrollToSection('faq')}>FAQ</button>
        <div className="navbar__mobile-actions">
          {mounted && user ? (
            <Link href="/dashboard" className="btn-primary btn-lg" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-primary btn-lg" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
              <Link href="/login" className="btn-secondary btn-lg" onClick={() => setMenuOpen(false)}>Log in</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
