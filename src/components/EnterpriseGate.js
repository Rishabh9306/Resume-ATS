'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function EnterpriseGate({ children }) {
  const { userData } = useAuth();
  const currentPlan = userData?.plan || 'free';
  const isEnterprise = currentPlan === 'enterprise';

  if (isEnterprise) {
    return <>{children}</>;
  }

  return (
    <div className="enterprise-gate-container glass-card fade-in" style={{ margin: 'var(--space-2xl) auto', maxWidth: '600px' }}>
      <div className="enterprise-gate-icon">🏢</div>
      <h3 className="enterprise-gate-title">Enterprise Plan Required</h3>
      <p className="enterprise-gate-desc">
        Unlock administrative team management (up to 5 seats), parallel bulk scans, custom branding, and developer API access designed for recruiters and engineering managers.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
        <Link href="/dashboard/billing" className="btn-primary" style={{ textDecoration: 'none' }}>
          Upgrade to Enterprise
        </Link>
        <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
