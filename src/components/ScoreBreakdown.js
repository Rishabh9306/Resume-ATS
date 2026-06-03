import { useState } from 'react';
import { PLANS, ATS_CRITERIA } from '@/lib/constants';
import Link from 'next/link';

export default function ScoreBreakdown({ breakdown, currentPlan = 'free' }) {
  const [expandedItems, setExpandedItems] = useState({});

  if (!breakdown) return null;

  const toggleItem = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getScoreColorClass = (s) => {
    if (s < 40) return 'low';
    if (s <= 70) return 'medium';
    return 'high';
  };

  const criteriaKeys = Object.keys(ATS_CRITERIA);
  const planInfo = PLANS[currentPlan] || PLANS.free;

  return (
    <div className="breakdown-list">
      {criteriaKeys.map((key) => {
        const criteria = ATS_CRITERIA[key];
        const data = breakdown[key];
        if (!data) return null;

        const isAllowed = planInfo.allowedBreakdowns?.includes(key) ?? true;
        const score = typeof data === 'object' ? (data.score ?? 0) : data;
        const isExpanded = expandedItems[key];
        const scoreClass = getScoreColorClass(score);

        // All advanced breakdowns unlock at Pro tier
        let requiredPlan = 'pro';

        return (
          <div
            key={key}
            className={`breakdown-item ${isExpanded ? 'breakdown-item--open' : ''} ${!isAllowed ? 'breakdown-item--gated' : ''}`}
          >
            <div
              className="breakdown-item__header"
              onClick={() => toggleItem(key)}
              style={{ cursor: 'pointer' }}
            >
              <div className="breakdown-item__icon">
                {criteria.icon}
              </div>
              <div className="breakdown-item__info">
                <div className="breakdown-item__name">
                  {criteria.name}
                  {!isAllowed && (
                    <span 
                      style={{ 
                        marginLeft: 'var(--space-sm)', 
                        fontSize: '10px', 
                        padding: '1px 6px', 
                        background: 'rgba(255,255,255,0.06)', 
                        color: 'var(--text-secondary)', 
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {requiredPlan.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="breakdown-item__bar">
                  <div
                    className="breakdown-item__bar-fill"
                    style={{
                      width: `${isAllowed ? score : 15}%`,
                      background: isAllowed ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)'
                    }}
                  />
                </div>
              </div>
              <span className={`breakdown-item__score ${isAllowed ? `text-${scoreClass}` : ''}`}>
                {isAllowed ? `${score}%` : '🔒'}
              </span>
              <span className="breakdown-item__expand">
                ▼
              </span>
            </div>

            <div className="breakdown-item__details" style={{
              maxHeight: isExpanded ? '1000px' : '0',
              transition: 'max-height var(--transition-slow)',
              overflow: 'hidden'
            }}>
              <div className="breakdown-item__details-inner">
                {isAllowed ? (
                  typeof data === 'object' && (
                    <>
                      {data.findings && (
                        <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                          {data.findings}
                        </p>
                      )}

                      {data.matched && data.matched.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: 'var(--space-xs)' }}>
                            ✓ Matched Keywords / Elements
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                            {data.matched.map((item, i) => (
                              <span 
                                key={i} 
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  padding: '2px 8px',
                                  background: 'rgba(46, 213, 115, 0.08)',
                                  color: 'var(--success)',
                                  border: '1px solid rgba(46, 213, 115, 0.15)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.missing && data.missing.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 'var(--space-xs)' }}>
                            ✕ Missing Keywords / Elements
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                            {data.missing.map((item, i) => (
                              <span 
                                key={i} 
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  padding: '2px 8px',
                                  background: 'rgba(255, 71, 87, 0.08)',
                                  color: 'var(--danger)',
                                  border: '1px solid rgba(255, 71, 87, 0.15)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.suggestions && data.suggestions.length > 0 && (
                        <div>
                          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-secondary)', marginBottom: 'var(--space-xs)' }}>
                            💡 Suggestions for Improvement
                          </span>
                          <ul style={{ paddingLeft: 'var(--space-md)', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
                            {data.suggestions.map((s, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <div 
                    style={{
                      padding: 'var(--space-lg)',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-xs)' }}>🔒</div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                      Unlock {criteria.name} Analysis
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: '360px', marginInline: 'auto' }}>
                      Get details, matched/missing indicators, and actionable layout/impact suggestions for {criteria.name}.
                    </p>
                    <Link href="/dashboard/billing" className="btn-primary" style={{ display: 'inline-flex', padding: '6px 16px', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
                      Upgrade to {requiredPlan.toUpperCase()}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
