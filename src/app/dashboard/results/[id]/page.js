'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ScoreCard from '@/components/ScoreCard';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import AISuggestions from '@/components/AISuggestions';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const currentPlan = userData?.plan || 'free';
  const planInfo = PLANS[currentPlan] || PLANS.free;
  const hasAI = planInfo.aiSuggestions;

  useEffect(() => {
    if (!params.id) return;

    const fetchScan = async () => {
      if (params.id === 'temp' || params.id === 'demo') {
        try {
          const stored = sessionStorage.getItem('last_scan_result');
          if (stored) {
            setScanData(JSON.parse(stored));
          } else {
            showToast('Scan not found', 'error');
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Error loading temp scan:', err);
          showToast('Failed to load scan results', 'error');
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!user || !db) {
        // Try reading matching temp scan if database is offline or user auth is slow
        try {
          const stored = sessionStorage.getItem('last_scan_result');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.scanId === params.id) {
              setScanData(parsed);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}

        if (!user) return;
      }

      try {
        const scanRef = doc(db, 'scans', params.id);
        const scanSnap = await getDoc(scanRef);
        if (scanSnap.exists()) {
          setScanData({ id: scanSnap.id, ...scanSnap.data() });
        } else {
          // Fallback to local storage matching scan
          try {
            const stored = sessionStorage.getItem('last_scan_result');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.scanId === params.id) {
                setScanData(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (e) {}

          showToast('Scan not found', 'error');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching scan:', err);
        // Fallback to local storage offline check
        try {
          const stored = sessionStorage.getItem('last_scan_result');
          if (stored) {
            setScanData(JSON.parse(stored));
            showToast('Loaded local scan (offline fallback)', 'info');
          } else {
            throw err;
          }
        } catch (fallbackErr) {
          showToast('Failed to load scan results', 'error');
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [user, params.id]);

  const handleGenerateAI = async () => {
    if (!hasAI) {
      showToast('Upgrade to Starter or above for AI suggestions', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const token = user ? await user.getIdToken() : '';
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          resumeText: scanData.resumeText,
          jobDescription: scanData.jobDescription,
          breakdown: scanData.breakdown,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to generate suggestions');
      }
      const data = await res.json();
      setAiSuggestions(data.suggestions);

      // Save suggestions in temp storage if in temp mode
      if (params.id === 'temp' || params.id === 'demo') {
        try {
          const stored = sessionStorage.getItem('last_scan_result');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.aiSuggestions = data.suggestions;
            sessionStorage.setItem('last_scan_result', JSON.stringify(parsed));
          }
        } catch (e) {}
      }

      showToast('AI suggestions generated!', 'success');
    } catch (err) {
      console.error('AI error:', err);
      showToast(err.message || 'Failed to generate AI suggestions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results-page fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!scanData) return null;

  const score = Math.round(scanData.score || scanData.overallScore || 0);
  const displaySuggestions = aiSuggestions || scanData.aiSuggestions;

  const handleExportPDF = () => {
    if (!['pro', 'teams', 'enterprise'].includes(currentPlan)) {
      showToast('PDF Export requires a Pro plan or above. Upgrade from just ₹149/mo!', 'warning');
      router.push('/dashboard/billing');
      return;
    }
    window.print();
  };

  return (
    <div className="results-page fade-in">
      {/* Custom Print Header (Only visible during print) */}
      {currentPlan === 'enterprise' && (userData?.brandName || userData?.brandLogo) && (
        <div className="print-only-header" style={{
          display: 'none',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: '1rem',
          marginBottom: '2rem',
          width: '100%'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#6c63ff' }}>{userData?.brandName || 'Enterprise Candidate Report'}</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>Resume ATS Optimization Report</p>
          </div>
          {userData?.brandLogo && (
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#00d4aa' }}>
              {userData.brandLogo.startsWith('http') ? (
                <img src={userData.brandLogo} alt="Logo" style={{ maxHeight: '40px' }} />
              ) : (
                userData.brandLogo
              )}
            </span>
          )}
        </div>
      )}
      <div className="results-layout">
        {/* Left Sticky Column */}
        <div className="results-left">
          <div className="results-card-sticky">
            <ScoreCard score={score} size={200} label="ATS Score" />
            <div className="results-summary-info">
              <h2>
                {score >= 80 ? '🎉 Excellent Match!' : score >= 60 ? '👍 Good Progress' : score >= 40 ? '⚠️ Needs Work' : '❌ Needs Redo'}
              </h2>
              <p className="results-summary-text">
                Your resume matches <strong>{score}%</strong> of the job criteria.
              </p>
              {scanData.suggestions && scanData.suggestions.length > 0 && (
                <ul className="results-tips">
                  {scanData.suggestions.slice(0, 3).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="results-actions-block" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link href="/dashboard/scan" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>📝 Rescan</Link>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                  const url = `${window.location.origin}/dashboard/results/${params.id}`;
                  navigator.clipboard.writeText(url);
                  showToast('Link copied to clipboard!', 'success');
                }}>🔗 Share</button>
                <button className="btn-secondary" style={{ flex: 1.2, justifyContent: 'center' }} onClick={handleExportPDF}>
                  📄 Export PDF {!['pro', 'teams', 'enterprise'].includes(currentPlan) && '🔒'}
                </button>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget', { detail: { tab: 'bug' } }))}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', marginTop: 'var(--space-xs)' }}
              >
                Report score mismatch or parsing issue
              </button>
            </div>
          </div>
        </div>

        {/* Right Details Column */}
        <div className="results-right-details">
          <div className="results-section-wrapper">
            <div className="results-section-header">
              <h3 className="results-section-title-text">📊 Score Breakdown</h3>
            </div>
            <ScoreBreakdown breakdown={scanData.breakdown} currentPlan={currentPlan} />
          </div>

          <div className="results-section-wrapper">
            <div className="results-section-header">
              <h3 className="results-section-title-text">
                ✨ AI Improvement Suggestions
                {!hasAI && <span className="badge badge-accent" style={{ marginLeft: '8px' }}>Pro</span>}
              </h3>
            </div>
            {displaySuggestions ? (
              <AISuggestions suggestions={displaySuggestions} isLocked={false} />
            ) : (
              <div className="results-ai-prompt">
                {hasAI ? (
                  <>
                    <p>Unlock complete professional rewrites for your bullets, profile summary, and missing keywords optimized specifically for this job.</p>
                    <button className="btn-primary" onClick={handleGenerateAI} disabled={aiLoading} style={{ marginTop: '0.5rem' }}>
                      {aiLoading ? (
                        <><span className="loading-spinner small" /> Generating Suggestions...</>
                      ) : (
                        '✨ Generate AI Suggestions'
                      )}
                    </button>
                  </>
                ) : (
                  <AISuggestions suggestions={null} isLocked={true} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
