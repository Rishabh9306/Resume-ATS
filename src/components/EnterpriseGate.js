'use client';

import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import Link from 'next/link';

const PLAN_RANK = { free: 0, pro: 1, teams: 2, enterprise: 3 };

/**
 * Generic plan gate component. Wraps children and shows an upgrade prompt
 * if the user's plan rank is below the requiredPlan.
 * @param {string} requiredPlan - Minimum plan required ('pro' | 'teams' | 'enterprise')
 * @param {string} featureDescription - Description shown in the upgrade prompt
 */
export default function EnterpriseGate({ children, requiredPlan = 'enterprise', featureDescription }) {
  const { userData } = useAuth();
  const currentPlan = userData?.plan || 'free';
  const hasAccess = (PLAN_RANK[currentPlan] || 0) >= (PLAN_RANK[requiredPlan] || 0);

  if (hasAccess) {
    return <>{children}</>;
  }

  const planInfo = PLANS[requiredPlan];
  const planName = planInfo?.name || requiredPlan;

  return (
    <div className="enterprise-gate-container glass-card fade-in" style={{ margin: 'var(--space-2xl) auto', maxWidth: '600px' }}>
      <div className="enterprise-gate-icon">{requiredPlan === 'enterprise' ? '🏢' : '🚀'}</div>
      <h3 className="enterprise-gate-title">{planName} Plan Required</h3>
      <p className="enterprise-gate-desc">
        {featureDescription || `Upgrade to ${planName} to unlock this feature. Plans start at just ₹${planInfo?.price || 149}/mo.`}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
        <Link href="/dashboard/billing" className="btn-primary" style={{ textDecoration: 'none' }}>
          Upgrade to {planName}
        </Link>
        <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
