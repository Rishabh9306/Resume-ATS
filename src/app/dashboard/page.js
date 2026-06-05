'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import ScanHistory from '@/components/ScanHistory';

export default function DashboardHome() {
  const { user, userData, refreshUserData } = useAuth();
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    avgScore: 0,
    bestScore: 0,
    scansThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentPlan = userData?.plan || 'free';
  const planInfo = PLANS[currentPlan] || PLANS.free;

  const handleRefresh = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      if (refreshUserData) {
        await refreshUserData();
      }
      const scansRef = collection(db, 'scans');
      const queryField = ['teams', 'enterprise'].includes(currentPlan) ? 'teamOwnerId' : 'userId';
      const q = query(
        scansRef,
        where(queryField, '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const scanData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setScans(scanData);

      const now = new Date();
      const thisMonth = scanData.filter((s) => {
        const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const scores = scanData.map((s) => s.score || 0).filter((s) => s > 0);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const best = scores.length > 0 ? Math.max(...scores) : 0;

      setStats({
        totalScans: scanData.length,
        avgScore: avg,
        bestScore: best,
        scansThisMonth: thisMonth.length,
      });
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const fetchScans = async () => {
      try {
        const scansRef = collection(db, 'scans');
        const queryField = ['teams', 'enterprise'].includes(currentPlan) ? 'teamOwnerId' : 'userId';
        const q = query(
          scansRef,
          where(queryField, '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const scanData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setScans(scanData);

        // Calculate stats
        const now = new Date();
        const thisMonth = scanData.filter((s) => {
          const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const scores = scanData.map((s) => s.score || 0).filter((s) => s > 0);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const best = scores.length > 0 ? Math.max(...scores) : 0;

        setStats({
          totalScans: scanData.length,
          avgScore: avg,
          bestScore: best,
          scansThisMonth: thisMonth.length,
        });
      } catch (err) {
        console.error('Error fetching scans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [user, currentPlan]);

  const scansRemaining = planInfo.scansPerMonth === -1
    ? 'Unlimited'
    : Math.max(0, planInfo.scansPerMonth - (userData?.scansUsed || 0));

  const displayName = user?.displayName || userData?.displayName || 'there';

  return (
    <div className="dashboard-home fade-in">
      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Here&apos;s an overview of your resume scanning activity.
          </p>
        </div>
        <span className={`plan-badge plan-${currentPlan}`} style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}>{planInfo.name} Plan</span>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-card__header">
            <span className="stat-card__label">Total Scans</span>
          </div>
          <div className="stat-card__value">{loading ? '—' : stats.totalScans}</div>
          <div className="stat-card__trend">
            {stats.scansThisMonth} scans this month
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-card__header">
            <span className="stat-card__label">Average Score</span>
          </div>
          <div className="stat-card__value">{loading ? '—' : `${stats.avgScore}%`}</div>
          <div className="stat-card__trend stat-card__trend--up">
            {stats.avgScore > 0 ? 'Keep improving!' : 'Start scanning'}
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-card__header">
            <span className="stat-card__label">Best Score</span>
          </div>
          <div className="stat-card__value">{loading ? '—' : `${stats.bestScore}%`}</div>
          <div className="stat-card__trend stat-card__trend--up">
            {stats.bestScore >= 80 ? 'Excellent!' : 'Room to grow'}
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-card__header">
            <span className="stat-card__label">Scans Remaining</span>
            <button 
              className="stat-card__icon" 
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh Stats"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: 'var(--space-xs)',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ 
                  opacity: 0.85,
                  transformOrigin: 'center',
                  animation: loading ? 'spin 1s linear infinite' : 'none'
                }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          </div>
          <div className="stat-card__value">{loading ? '—' : scansRemaining}</div>
          <div className="stat-card__trend">
            {planInfo.scansPerMonth === -1
              ? 'Unlimited plan'
              : `${planInfo.scansPerMonth}/month limit`}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
        <Link href="/dashboard/scan" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', textDecoration: 'none' }}>
          📝 New Scan
        </Link>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget', { detail: { tab: 'feedback' } }))}
          className="btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
        >
          ⭐ Leave Feedback
        </button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget', { detail: { tab: 'bug' } }))}
          className="btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
        >
          🐛 Report a Bug
        </button>
      </div>

      {/* Recent Scans */}
      <div className="dashboard-section glass-card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Recent Scans</h3>
          {scans.length > 5 && (
            <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              View All
            </Link>
          )}
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
            <div className="loading-spinner" />
          </div>
        ) : (
          <ScanHistory scans={scans.slice(0, 5)} />
        )}
      </div>
    </div>
  );
}
