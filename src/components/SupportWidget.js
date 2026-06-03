'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const TABS = [
  { id: 'support', label: 'Support', icon: '💬' },
  { id: 'feedback', label: 'Feedback', icon: '⭐' },
  { id: 'bug', label: 'Report Bug', icon: '🐛' },
];

const HELP_LINKS = [
  { icon: '📖', title: 'Getting Started Guide', desc: 'Learn how to scan your first resume', href: '/#faq' },
  { icon: '🎯', title: 'How ATS Scoring Works', desc: '6 criteria that determine your score', href: '/#features' },
  { icon: '💰', title: 'Pricing & Plans', desc: 'Compare Free, Pro, Teams & Enterprise', href: '/#pricing' },
  { icon: '📧', title: 'Email Support', desc: 'support@resumeats.com', href: 'mailto:support@resumeats.com' },
];

const RATING_EMOJIS = [
  { value: 1, emoji: '😡', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Amazing' },
];

const BUG_CATEGORIES = ['Scanning Issue', 'Payment Problem', 'UI/Display Bug', 'Performance', 'Other'];

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('support');
  const [successState, setSuccessState] = useState(null); // 'feedback' | 'bug' | null
  const panelRef = useRef(null);
  const pathname = usePathname();
  const { user } = useAuth();

  // Feedback state
  const [rating, setRating] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Bug report state
  const [bugCategory, setBugCategory] = useState('');
  const [bugSeverity, setBugSeverity] = useState('Medium');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSteps, setBugSteps] = useState('');
  const [sendingBug, setSendingBug] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Reset success state
  useEffect(() => {
    if (!successState) return;
    const timer = setTimeout(() => {
      setSuccessState(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [successState]);

  // Listen for external open event (from sidebar button or other triggers)
  useEffect(() => {
    const handleOpenEvent = (e) => {
      setIsOpen(true);
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('open-support-widget', handleOpenEvent);
    return () => window.removeEventListener('open-support-widget', handleOpenEvent);
  }, []);

  const handleSubmitFeedback = async () => {
    if (!rating) return;
    setSendingFeedback(true);
    try {
      if (db) {
        await addDoc(collection(db, 'feedback'), {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
          rating,
          message: feedbackMsg,
          page: pathname,
          createdAt: new Date(),
        });
      }
      setRating(0);
      setFeedbackMsg('');
      setSuccessState('feedback');
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleSubmitBug = async () => {
    if (!bugCategory || !bugDesc.trim()) return;
    setSendingBug(true);
    try {
      if (db) {
        await addDoc(collection(db, 'bug_reports'), {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
          category: bugCategory,
          severity: bugSeverity,
          description: bugDesc,
          steps: bugSteps,
          page: pathname,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          createdAt: new Date(),
        });
      }
      setBugCategory('');
      setBugSeverity('Medium');
      setBugDesc('');
      setBugSteps('');
      setSuccessState('bug');
    } catch (err) {
      console.error('Bug report submit error:', err);
    } finally {
      setSendingBug(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────
  const fabStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(108, 99, 255, 0.4)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const fabDotStyle = {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#00d4aa',
    border: '2px solid #0f0f14',
  };

  const panelStyle = {
    position: 'fixed',
    bottom: '92px',
    right: '24px',
    width: '380px',
    maxHeight: '520px',
    background: 'rgba(15, 15, 20, 0.98)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  };

  const tabBarStyle = {
    display: 'flex',
    gap: '2px',
    padding: '0 12px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  };

  const getTabStyle = (id) => ({
    flex: 1,
    padding: '10px 4px',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === id ? '2px solid #6c63ff' : '2px solid transparent',
    color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.45)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  });

  const bodyStyle = {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
    maxHeight: '380px',
  };

  const helpCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.2s ease',
    marginBottom: '8px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  };

  const btnPrimaryStyle = {
    width: '100%',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    marginTop: '12px',
  };

  const severityBtnStyle = (active) => ({
    flex: 1,
    padding: '8px 8px',
    background: active ? 'rgba(108, 99, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
    border: active ? '1px solid rgba(108, 99, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    color: active ? '#a29bfe' : 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const successStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '12px',
  };

  // ── Render ──────────────────────────────────────────────
  const renderSuccess = (type) => (
    <div style={successStyle}>
      <div style={{ fontSize: '48px', animation: 'pulse 0.5s ease' }}>✅</div>
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
        {type === 'feedback' ? 'Thanks for your feedback!' : 'Bug report submitted!'}
      </h4>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        {type === 'feedback'
          ? 'Your input helps us improve ResumeATS.'
          : 'Our team will investigate this issue.'}
      </p>
    </div>
  );

  const renderSupport = () => (
    <div>
      {HELP_LINKS.map((link, i) => (
        <a
          key={i}
          href={link.href}
          style={helpCardStyle}
          target={link.href.startsWith('mailto') ? '_blank' : undefined}
          rel={link.href.startsWith('mailto') ? 'noopener noreferrer' : undefined}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <span style={{ fontSize: '22px', flexShrink: 0 }}>{link.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{link.title}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{link.desc}</div>
          </div>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>→</span>
        </a>
      ))}

      <div style={{
        marginTop: '16px',
        padding: '12px 14px',
        background: 'rgba(108, 99, 255, 0.06)',
        border: '1px solid rgba(108, 99, 255, 0.12)',
        borderRadius: '10px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.5,
      }}>
        💡 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Tip:</strong> Pro and above users get priority support with faster response times.
      </div>
    </div>
  );

  const renderFeedback = () => {
    if (successState === 'feedback') return renderSuccess('feedback');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>
            How&apos;s your experience?
          </label>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {RATING_EMOJIS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRating(r.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: rating === r.value ? '2px solid #6c63ff' : '1px solid rgba(255,255,255,0.08)',
                  background: rating === r.value ? 'rgba(108, 99, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: rating === r.value ? 'scale(1.12)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#6c63ff', fontWeight: 600, marginTop: '6px' }}>
              {RATING_EMOJIS.find(r => r.value === rating)?.label}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
            Tell us more (optional)
          </label>
          <textarea
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            placeholder="What do you love? What could be better?"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        <button
          style={{ ...btnPrimaryStyle, marginTop: '4px', opacity: !rating ? 0.5 : 1, cursor: !rating ? 'not-allowed' : 'pointer' }}
          onClick={handleSubmitFeedback}
          disabled={!rating || sendingFeedback}
        >
          {sendingFeedback ? 'Sending...' : '✨ Send Feedback'}
        </button>
      </div>
    );
  };

  const renderBug = () => {
    if (successState === 'bug') return renderSuccess('bug');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
            Bug Category *
          </label>
          <select
            value={bugCategory}
            onChange={(e) => setBugCategory(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
          >
            <option value="" disabled>Select a category...</option>
            {BUG_CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: '#1a1a24', color: '#fff' }}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
            Severity
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Low', 'Medium', 'Critical'].map((s) => (
              <button key={s} onClick={() => setBugSeverity(s)} style={severityBtnStyle(bugSeverity === s)}>
                {s === 'Low' ? '🟡' : s === 'Medium' ? '🟠' : '🔴'} {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
            Description *
          </label>
          <textarea
            value={bugDesc}
            onChange={(e) => setBugDesc(e.target.value)}
            placeholder="Describe what went wrong..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
            Steps to Reproduce (optional)
          </label>
          <textarea
            value={bugSteps}
            onChange={(e) => setBugSteps(e.target.value)}
            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
          />
        </div>

        <button
          style={{
            ...btnPrimaryStyle,
            marginTop: '2px',
            opacity: !bugCategory || !bugDesc.trim() ? 0.5 : 1,
            cursor: !bugCategory || !bugDesc.trim() ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
          }}
          onClick={handleSubmitBug}
          disabled={!bugCategory || !bugDesc.trim() || sendingBug}
        >
          {sendingBug ? 'Submitting...' : '🐛 Submit Bug Report'}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Panel */}
      <div ref={panelRef} style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            Help & Support
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={tabBarStyle}>
          {TABS.map((tab) => (
            <button key={tab.id} style={getTabStyle(tab.id)} onClick={() => { setActiveTab(tab.id); setSuccessState(null); }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {activeTab === 'support' && renderSupport()}
          {activeTab === 'feedback' && renderFeedback()}
          {activeTab === 'bug' && renderBug()}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={fabStyle}
        aria-label="Help & Support"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(108, 99, 255, 0.55)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(108, 99, 255, 0.4)'; }}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span style={fabDotStyle} />}
      </button>

      {/* Responsive overrides */}
      <style jsx global>{`
        @media (max-width: 480px) {
          [data-support-panel] {
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            bottom: 88px !important;
            max-height: 70vh !important;
          }
        }
        @keyframes supportPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4); }
          50% { box-shadow: 0 4px 28px rgba(108, 99, 255, 0.6); }
        }
      `}</style>
    </>
  );
}
