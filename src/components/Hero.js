'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Hero() {
  const [demoFile, setDemoFile] = useState(null);
  const [demoJD, setDemoJD] = useState('');
  const [demoResult, setDemoResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDemoAnalyze = async () => {
    if (!demoFile || !demoJD.trim()) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resumeFile', demoFile);
      formData.append('jobDescription', demoJD);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.overallScore !== undefined) {
        setDemoResult(data);
      }
    } catch (err) {
      console.error('Demo analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="hero">
      <div className="hero__bg-orbs">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__particle hero__particle--1" />
        <div className="hero__particle hero__particle--2" />
        <div className="hero__particle hero__particle--3" />
        <div className="hero__particle hero__particle--4" />
        <div className="hero__particle hero__particle--5" />
        <div className="hero__particle hero__particle--6" />
      </div>

      <div className="hero__content">
        <div className="hero__badge">✨ AI-Powered Resume Analysis</div>
        <h1 className="hero__title">
          Get Your Resume Past <span className="gradient-text">Every Job Role</span>
        </h1>
        <p className="hero__subtitle">
          AI-powered analysis scores your resume against any job description.
          Fix what&apos;s wrong. Land more interviews.
        </p>
        <div className="hero__ctas">
          <Link href="/login" className="btn-primary btn-lg">Check My Resume Free</Link>
          <button className="btn-secondary btn-lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
            See How It Works
          </button>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-value">10,000+ </span>
            <span className="hero__stat-label">Resumes Analyzed</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">85% </span>
            <span className="hero__stat-label">Avg Score Improvement</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">30s </span>
            <span className="hero__stat-label">Analysis Time</span>
          </div>
        </div>
      </div>

      <div className="hero__demo container" id="demo">
        <h3 className="hero__demo-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-primary)' }}>
          Try it free — no sign-up needed
        </h3>
        <div className="hero__demo-grid">
          <label className={`hero__demo-upload ${demoFile ? 'hero__demo-upload--active' : ''}`} htmlFor="demo-file-input">
            <input
              type="file"
              id="demo-file-input"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={(e) => setDemoFile(e.target.files?.[0] || null)}
            />
            <div className="hero__demo-upload-icon">📄</div>
            {demoFile ? (
              <p className="hero__demo-file-name">{demoFile.name}</p>
            ) : (
              <>
                <p className="hero__demo-upload-text">Drop resume or click to browse</p>
                <p className="hero__demo-upload-hint">PDF, DOCX up to 5MB</p>
              </>
            )}
          </label>
          <div className="hero__demo-jd">
            <textarea
              className="form-input"
              placeholder="Paste the job description here..."
              value={demoJD}
              onChange={(e) => setDemoJD(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div className="hero__demo-actions" style={{ marginTop: 'var(--space-lg)' }}>
          <button
            className="btn-primary btn-lg hero__demo-btn"
            disabled={!demoFile || !demoJD.trim() || analyzing}
            onClick={handleDemoAnalyze}
            style={{ minWidth: '200px' }}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Free'}
          </button>
        </div>
        {demoResult && (
          <div className="hero__demo-result" style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
            <div className="hero__demo-score" style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 800,
              color: demoResult.overallScore > 70 ? 'var(--success)' : demoResult.overallScore > 40 ? 'var(--warning)' : 'var(--danger)'
            }}>
              {Math.round(demoResult.overallScore)}%
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>ATS Compatibility Score</p>
            <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-md)' }}>
              Sign up for detailed breakdown →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
