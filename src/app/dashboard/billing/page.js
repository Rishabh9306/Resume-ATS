'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useToast } from '@/components/Toast';

export default function BillingPage() {
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(null);

  const currentPlan = userData?.plan || 'free';
  const planInfo = PLANS[currentPlan] || PLANS.free;
  const scansUsed = userData?.scansUsed || 0;
  const scansLimit = planInfo.scansPerMonth;
  const usagePercent = scansLimit === -1 ? 0 : Math.min(100, Math.round((scansUsed / scansLimit) * 100));

  useEffect(() => {
    if (!user || !db) return;
    const fetchInvoices = async () => {
      try {
        const invoicesRef = collection(db, 'invoices');
        const q = query(invoicesRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }
    };
    fetchInvoices();
  }, [user]);

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upgrade');

      if (data.isMock) {
        showToast('Developer Mock Mode: Simulating payment...', 'info');
        setTimeout(async () => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
                razorpay_order_id: data.orderId,
                razorpay_signature: 'mock_signature',
                planId,
              }),
            });
            if (!verifyRes.ok) throw new Error('Mock verification failed');
            showToast(`Mock payment successful! Upgraded to ${PLANS[planId].name}.`, 'success');
            setTimeout(() => window.location.reload(), 2000);
          } catch (verifyErr) {
            console.error(verifyErr);
            showToast('Mock verification failed.', 'error');
          }
        }, 1500);
        return;
      }

      // ── Load Razorpay Standard Checkout (Orders flow) ─────────
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: 'ResumeATS Pro',
          description: `${PLANS[planId].name} Plan - ₹${PLANS[planId].price}/month`,
          handler: async (response) => {
            // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
            showToast('Verifying payment...', 'info');
            try {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  planId,
                }),
              });
              if (!verifyRes.ok) throw new Error('Payment verification failed');
              showToast('Payment successful! Your plan has been upgraded.', 'success');
              setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
              console.error('Verification error:', err);
              showToast('Payment completed but verification failed. Please contact support.', 'warning');
              setTimeout(() => window.location.reload(), 3000);
            }
          },
          prefill: { email: user.email, name: user.displayName },
          theme: { color: '#6c63ff' },
          modal: {
            ondismiss: () => {
              showToast('Payment cancelled.', 'info');
              setUpgrading(null);
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        showToast('Failed to load payment gateway. Please try again.', 'error');
        setUpgrading(null);
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error('Upgrade error:', err);
      showToast(err.message || 'Failed to initiate payment', 'error');
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/razorpay/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Cancel failed');
      showToast('Subscription cancelled successfully. Refreshing plan...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast('Failed to cancel subscription', 'error');
    }
  };

  return (
    <div className="billing-page fade-in">
      {/* Current Plan */}
      <div className="billing__current-plan glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h3 className="billing__plan-name">{planInfo.name} Plan</h3>
            <p className="billing__plan-info">
              {planInfo.price === 0 ? 'Free Plan' : `₹${planInfo.price}/month`}
            </p>
          </div>
          <span className={`badge badge-accent`}>{planInfo.name}</span>
        </div>
        {scansLimit !== -1 && (
          <div className="usage-section" style={{ marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
              <span>Scans used</span>
              <span>{scansUsed} / {scansLimit}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent-gradient)', width: `${usagePercent}%`, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
        {currentPlan !== 'free' && (
          <button className="btn-ghost" onClick={handleCancel} style={{ marginTop: 'var(--space-md)', color: 'var(--danger)', padding: 0 }}>
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Plan Comparison */}
      <h3 style={{ margin: 'var(--space-2xl) 0 var(--space-lg)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
        {currentPlan === 'free' ? 'Upgrade Your Plan' : 'Change Plan'}
      </h3>
      <div className="pricing__grid">
        {Object.values(PLANS).map((plan) => (
          <div key={plan.id} className={`pricing-card glass-card ${plan.popular ? 'pricing-card--popular' : ''} ${plan.id === currentPlan ? 'pricing-card--current' : ''}`}>
            {plan.id === currentPlan && <div className="pricing-card__badge" style={{ background: 'var(--success)' }}>Current Plan</div>}
            {plan.popular && plan.id !== currentPlan && <div className="pricing-card__badge">Most Popular</div>}
            
            <h3 className="pricing-card__name" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{plan.name}</h3>
            
            <div className="pricing-card__price" style={{ display: 'flex', alignItems: 'baseline', marginBottom: 'var(--space-lg)' }}>
              {plan.price === 0 ? (
                <span className="pricing-card__amount" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Free</span>
              ) : (
                <>
                  <span className="pricing-card__amount" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>₹{plan.price}</span>
                  <span className="pricing-card__period" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>/mo</span>
                </>
              )}
            </div>
            
            <ul className="pricing-card__features" style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-xl)', flex: 1 }}>
              {plan.features.map((f, i) => (
                <li key={i} className="pricing-card__feature" style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                  <span className="pricing-card__feature-check" style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>✓</span> 
                  {f}
                </li>
              ))}
            </ul>
            
            {plan.id !== currentPlan && plan.id !== 'free' && (
              <button
                className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%' }}
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading === plan.id}
              >
                {upgrading === plan.id ? 'Processing...' : 'Upgrade'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div className="billing__invoices" style={{ marginTop: 'var(--space-3xl)' }}>
          <h3>Invoice History</h3>
          <div style={{ overflowX: 'auto', width: '100%', marginTop: 'var(--space-lg)' }}>
            <table className="scan-table">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td>₹{inv.amount}</td>
                    <td><span className={`badge badge-${inv.status === 'paid' ? 'success' : 'warning'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
