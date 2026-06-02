'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function AISuggestions({ suggestions, isLocked = false }) {
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    rewrites: true,
    summary: true,
    skills: true,
    keywords: true,
    advice: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  if (!suggestions && !isLocked) {
    return null;
  }

  return (
    <div className="ai-panel">

      {isLocked && (
        <div className="ai-panel__gate-overlay">
          <div className="ai-panel__gate-text">Unlock AI Suggestions</div>
          <div className="ai-panel__gate-subtext" style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '360px', marginBottom: 'var(--space-md)' }}>
            Upgrade to Starter or Pro plan to get personalized AI-powered rewrite suggestions.
          </div>
          <Link href="/dashboard/billing" className="btn-primary" style={{ textDecoration: 'none' }}>
            Upgrade Now
          </Link>
        </div>
      )}

      <div style={{ filter: isLocked ? 'blur(6px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto' }}>
        {/* Bullet Point Rewrites */}
        {suggestions?.bulletRewrites && suggestions.bulletRewrites.length > 0 && (
          <div className="ai-panel__section">
            <div className="ai-panel__section-header" onClick={() => toggleSection('rewrites')}>
              <span>📝 Bullet Point Rewrites</span>
              <span>{expandedSections.rewrites ? '▲' : '▼'}</span>
            </div>
            {expandedSections.rewrites && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md)' }}>
                {suggestions.bulletRewrites.map((rewrite, i) => (
                  <div key={i} className="ai-panel__comparison" style={{ padding: 0 }}>
                    <div className="ai-panel__before">
                      <div className="ai-panel__before-label">Original</div>
                      <p style={{ margin: 0 }}>{rewrite.original}</p>
                    </div>
                    <div className="ai-panel__after">
                      <div className="ai-panel__after-label">Improved</div>
                      <p style={{ marginBottom: 'var(--space-md)' }}>{rewrite.improved}</p>
                      <button
                        className="ai-panel__copy-btn"
                        onClick={() => copyToClipboard(rewrite.improved, `bullet-${i}`)}
                      >
                        {copiedId === `bullet-${i}` ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Rewrite */}
        {suggestions?.summaryRewrite && (
          <div className="ai-panel__section">
            <div className="ai-panel__section-header" onClick={() => toggleSection('summary')}>
              <span>📄 Summary Rewrite</span>
              <span>{expandedSections.summary ? '▲' : '▼'}</span>
            </div>
            {expandedSections.summary && (
              <div style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>
                  {suggestions.summaryRewrite}
                </p>
                <button
                  className="ai-panel__copy-btn"
                  onClick={() => copyToClipboard(suggestions.summaryRewrite, 'summary')}
                >
                  {copiedId === 'summary' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Skills Optimization */}
        {suggestions?.skillsOptimization && (
          <div className="ai-panel__section">
            <div className="ai-panel__section-header" onClick={() => toggleSection('skills')}>
              <span>🎯 Skills Optimization</span>
              <span>{expandedSections.skills ? '▲' : '▼'}</span>
            </div>
            {expandedSections.skills && (
              <div style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>
                  {suggestions.skillsOptimization}
                </p>
                <button
                  className="ai-panel__copy-btn"
                  onClick={() => copyToClipboard(suggestions.skillsOptimization, 'skills')}
                >
                  {copiedId === 'skills' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Missing Keyword Integration */}
        {suggestions?.missingKeywords && suggestions.missingKeywords.length > 0 && (
          <div className="ai-panel__section">
            <div className="ai-panel__section-header" onClick={() => toggleSection('keywords')}>
              <span>🔑 Missing Keyword Integration</span>
              <span>{expandedSections.keywords ? '▲' : '▼'}</span>
            </div>
            {expandedSections.keywords && (
              <div style={{ padding: 'var(--space-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                {suggestions.missingKeywords.map((kw, i) => (
                  <div key={i} style={{
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 'var(--space-xs)' }}>
                      {kw.keyword}
                    </span>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                      {kw.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overall Advice */}
        {suggestions?.overallAdvice && (
          <div className="ai-panel__section">
            <div className="ai-panel__section-header" onClick={() => toggleSection('advice')}>
              <span>💡 Overall Advice</span>
              <span>{expandedSections.advice ? '▲' : '▼'}</span>
            </div>
            {expandedSections.advice && (
              <div style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {suggestions.overallAdvice}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
