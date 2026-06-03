'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Scan', href: '/dashboard/scan' },
  { label: 'Bulk Scanning', href: '/dashboard/bulk', requiredPlan: 'teams' },
  { label: 'Team Dashboard', href: '/dashboard/team', requiredPlan: 'teams' },
  { label: 'API Keys', href: '/dashboard/api', requiredPlan: 'enterprise' },
  { label: 'Billing', href: '/dashboard/billing' },
  { label: 'Settings', href: '/dashboard/settings' },
];

const PLAN_RANK = { free: 0, pro: 1, teams: 2, enterprise: 3 };

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, userData, signOut } = useAuth();

  const currentPlan = userData?.plan || 'free';
  const planInfo = PLANS[currentPlan] || PLANS.free;

  const displayName = user?.displayName || userData?.displayName || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href, label) => {
    if (label === 'History' && pathname === '/dashboard') return false;
    if (label === 'Dashboard' && pathname === '/dashboard') return true;
    if (label === 'History') return false;
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 99,
        backdropFilter: 'blur(4px)'
      }} />}
      <aside className={`dashboard__sidebar ${isOpen ? 'dashboard__sidebar--open' : ''}`}>
        <div className="dashboard__sidebar-logo">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="gradient-text" style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>ResumeATS</span>
            {currentPlan !== 'free' && (
              <span className="navbar__logo-badge">{planInfo.name}</span>
            )}
          </Link>
        </div>

        <nav className="dashboard__sidebar-nav">
          {navItems.map((item) => {
            const isLocked = item.requiredPlan && (PLAN_RANK[currentPlan] || 0) < (PLAN_RANK[item.requiredPlan] || 0);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`dashboard__sidebar-link ${isActive(item.href, item.label) ? 'dashboard__sidebar-link--active' : ''}`}
                onClick={onClose}
              >
                <span>{item.label} {isLocked && '🔒'}</span>
              </Link>
            );
          })}
          <button
            className="dashboard__sidebar-link"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('open-support-widget'));
            }}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 'inherit', marginTop: 'var(--space-xs)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 'var(--space-md)' }}
          >
            <span>💬 Help & Feedback</span>
          </button>
        </nav>

        <div className="dashboard__sidebar-bottom" style={{
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'var(--space-xl)'
        }}>
          <div className="dashboard__sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div className="dashboard__sidebar-avatar" style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              overflow: 'hidden'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                {displayName}
              </span>
              <span className={`plan-badge plan-${currentPlan}`} style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px', display: 'inline-block', width: 'fit-content' }}>
                {planInfo.name}
              </span>
            </div>
          </div>
          <button 
            onClick={signOut} 
            title="Sign Out"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-sm)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
