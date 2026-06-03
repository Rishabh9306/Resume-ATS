'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import EnterpriseGate from '@/components/EnterpriseGate';
import { useToast } from '@/components/Toast';

export default function BulkScanPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    
    // Check limit
    if (files.length + selected.length > 5) {
      showToast('Maximum 5 files can be uploaded for a single bulk scan.', 'warning');
      return;
    }

    // Validate size and format
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const MAX_SIZE = 5 * 1024 * 1024;

    const validFiles = selected.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`Skipped ${file.name}: Only PDF/DOCX are supported.`, 'error');
        return false;
      }
      if (file.size > MAX_SIZE) {
        showToast(`Skipped ${file.name}: Exceeds 5MB size limit.`, 'error');
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeBulk = async () => {
    if (files.length === 0) {
      showToast('Please upload at least one resume.', 'warning');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      showToast('Please paste a job description (min 20 characters).', 'warning');
      return;
    }

    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('resumeFiles', file);
      });
      formData.append('jobDescription', jobDescription);

      const token = user ? await user.getIdToken() : '';
      const response = await fetch('/api/analyze/bulk', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Bulk analysis failed.');
      }

      setResults(data.results);
      showToast(`Successfully analyzed ${data.results.filter(r => r.success).length} resumes!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error occurred during bulk analysis.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 40) return 'var(--danger)';
    if (score <= 70) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <EnterpriseGate requiredPlan="teams" featureDescription="Bulk resume scanning lets you analyze up to 10 resumes at once. Available on Teams (₹499/mo) and Enterprise plans.">
      <div className="scan-page fade-in">
        <div className="scan-page-header">
          <h2>Parallel Bulk Scanning</h2>
          <p>Recruiter dashboard: Upload up to 5 resumes simultaneously and rank them against a single job description.</p>
        </div>

        <div className="scan-grid">
          {/* Left Column: Upload and File List */}
          <div className="scan-upload-section glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <h3 className="scan-section-title">📁 Upload Resumes (Max 5)</h3>
            
            <div 
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            >
              <input 
                type="file" 
                multiple 
                accept=".pdf,.docx" 
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📤</div>
              <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600 }}>Click or Drag files to upload</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Supports PDF, DOCX up to 5MB each</p>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Selected Resumes ({files.length}/5)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {files.map((file, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: 'var(--text-xs)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        📄 {file.name}
                      </span>
                      <button 
                        onClick={() => removeFile(idx)} 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Job Description */}
          <div className="scan-jd-section glass-card">
            <h3 className="scan-section-title">💼 Job Description</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="job-desc-bulk">Job Description Details</label>
              <textarea
                id="job-desc-bulk"
                className="form-input scan-jd-input"
                placeholder="Paste the target job description here..."
                rows={12}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
          <button
            className="btn-primary btn-lg"
            onClick={handleAnalyzeBulk}
            disabled={files.length === 0 || !jobDescription.trim() || analyzing}
            style={{ minWidth: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)' }}
          >
            {analyzing ? 'Analyzing Batch...' : `Scan ${files.length} Resumes`}
          </button>
        </div>

        {/* Bulk Scan Results Table */}
        {results && (
          <div className="dashboard-section glass-card" style={{ marginTop: 'var(--space-3xl)', padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Batch Scan Leaderboard</h3>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="scan-table">
                <thead>
                  <tr>
                    <th>Candidate / File Name</th>
                    <th>ATS Score</th>
                    <th>Word Count</th>
                    <th>Pages</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{res.fileName}</td>
                      <td>
                        {res.success ? (
                          <span 
                            style={{ 
                              padding: '2px 8px', 
                              borderRadius: 'var(--radius-sm)', 
                              background: `${getScoreColor(res.overallScore)}15`, 
                              color: getScoreColor(res.overallScore),
                              fontWeight: 'bold',
                              fontSize: 'var(--text-sm)'
                            }}
                          >
                            {res.overallScore}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>{res.success ? res.wordCount : '—'}</td>
                      <td>{res.success ? res.pageEstimate : '—'}</td>
                      <td>
                        {res.success ? (
                          <span className="badge badge-success">Completed</span>
                        ) : (
                          <span className="badge badge-danger" title={res.error}>Failed</span>
                        )}
                      </td>
                      <td>
                        {res.success ? (
                          <Link href={`/dashboard/results/${res.scanId}`} className="scan-table__action-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                            View Report
                          </Link>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No report</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analyzing Overlay */}
        {analyzing && (
          <div className="analyzing-overlay">
            <div className="analyzing-animation">
              <div className="analyzing-dots">
                <span className="analyzing-dot" />
                <span className="analyzing-dot" />
                <span className="analyzing-dot" />
              </div>
              <p className="analyzing-text">Executing concurrent scanning queue...</p>
              <p className="analyzing-subtext">Running calculations for {files.length} documents in parallel</p>
            </div>
          </div>
        )}
      </div>
    </EnterpriseGate>
  );
}
