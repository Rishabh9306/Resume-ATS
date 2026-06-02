'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/components/Toast';

export default function ScanPage() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const currentPlan = userData?.plan || 'free';
  const planInfo = PLANS[currentPlan] || PLANS.free;
  const scansUsed = userData?.scansUsed || 0;
  const scanLimit = planInfo.scansPerMonth;
  const canScan = scanLimit === -1 || scansUsed < scanLimit;

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      showToast('Please upload a resume and enter a job description', 'warning');
      return;
    }

    if (!canScan) {
      showToast('You have reached your scan limit. Please upgrade your plan.', 'error');
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('resumeFile', file);
      formData.append('jobDescription', jobDescription);
      formData.append('jobTitle', jobTitle);

      const headers = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          // proceed without auth
        }
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      showToast('Analysis complete!', 'success');
      
      try {
        sessionStorage.setItem('last_scan_result', JSON.stringify(result));
      } catch (e) {
        console.error('Failed to store scan results locally:', e);
      }

      if (result.scanId) {
        router.push(`/dashboard/results/${result.scanId}`);
      } else {
        router.push(`/dashboard/results/temp`);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      showToast(err.message || 'Failed to analyze resume. Please try again.', 'error');
    } finally {
      setAnalyzing(false);
    }

  };

  return (
    <div className="scan-page fade-in">
      <div className="scan-page-header">
        <h2>Analyze Your Resume</h2>
        <p>Upload your resume and paste the job description to get your ATS compatibility score.</p>
      </div>

      {!canScan && (
        <div className="scan-limit-warning glass-card">
          <span className="scan-limit-icon">⚠️</span>
          <div>
            <strong>Scan limit reached</strong>
            <p>You&apos;ve used all {scanLimit} scans this month. Upgrade for more.</p>
          </div>
          <a href="/dashboard/billing" className="scan-upgrade-link">Upgrade</a>
        </div>
      )}

      <div className="scan-grid">
        {/* Left: File Upload */}
        <div className="scan-upload-section glass-card">
          <h3 className="scan-section-title">📄 Upload Resume</h3>
          <FileUpload onFileSelect={setFile} />
        </div>

        {/* Right: Job Description */}
        <div className="scan-jd-section glass-card">
          <h3 className="scan-section-title">💼 Job Description</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="job-title">
              Job Title <span className="form-optional">(optional)</span>
            </label>
            <input
              id="job-title"
              type="text"
              className="form-input"
              placeholder="e.g. Senior Frontend Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="job-desc">
              Job Description
            </label>
            <textarea
              id="job-desc"
              className="form-input scan-jd-input"
              placeholder="Paste the job description here..."
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
        <button
          className="btn-primary btn-lg"
          onClick={handleAnalyze}
          disabled={!file || !jobDescription.trim() || analyzing || !canScan}
          style={{ minWidth: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          {analyzing ? (
            <span className="analyze-btn-loading" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className="loading-spinner small" style={{ marginRight: '8px' }} />
              Analyzing...
            </span>
          ) : (
            <>Analyze Resume</>
          )}
        </button>
      </div>

      {/* Analyzing Overlay */}
      {analyzing && (
        <div className="analyzing-overlay">
          <div className="analyzing-animation">
            <div className="analyzing-dots">
              <span className="analyzing-dot" />
              <span className="analyzing-dot" />
              <span className="analyzing-dot" />
            </div>
            <p className="analyzing-text">Scanning your resume against ATS criteria...</p>
            <p className="analyzing-subtext">This usually takes 10-20 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
