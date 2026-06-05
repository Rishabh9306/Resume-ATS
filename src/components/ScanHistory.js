'use client';

import Link from 'next/link';

export default function ScanHistory({ scans }) {
  if (!scans || scans.length === 0) {
    return (
      <div className="scan-history-empty" style={{
        padding: 'var(--space-2xl)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <span style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-md)', display: 'block' }}>📭</span>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No scans yet</h4>
        <p style={{ fontSize: 'var(--text-sm)' }}>Analyze your first resume!</p>
        <Link 
          href="/dashboard/scan" 
          className="btn-primary" 
          style={{ display: 'inline-block', marginTop: 'var(--space-md)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
        >
          Start Scanning
        </Link>
      </div>
    );
  }

  const getScoreColor = (s) => {
    if (s < 40) return 'low';
    if (s <= 70) return 'medium';
    return 'high';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table className="scan-table">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Score</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.id}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                <div>{scan.jobTitle || 'Untitled Scan'}</div>
                {scan.userEmail && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>
                    by {scan.userEmail}
                  </div>
                )}
              </td>
              <td>
                <span className={`scan-table__score-badge scan-table__score-badge--${getScoreColor(scan.score)}`}>
                  {scan.score}%
                </span>
              </td>
              <td>
                {formatDate(scan.date || scan.createdAt)}
              </td>
              <td>
                <Link href={`/dashboard/results/${scan.id}`} className="scan-table__action-btn" style={{ textDecoration: 'none' }}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
