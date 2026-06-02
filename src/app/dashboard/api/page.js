'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import EnterpriseGate from '@/components/EnterpriseGate';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/Toast';

export default function ApiKeysPage() {
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const fetchApiKey = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setApiKey(userSnap.data().apiKey || '');
        }
      } catch (err) {
        console.error('Error fetching API Key:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [user]);

  const generateKey = async () => {
    setGenerating(true);
    try {
      const generated = 'ats_live_' + [...Array(32)].map(() => (~~(Math.random()*36)).toString(36)).join('');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { apiKey: generated });
      setApiKey(generated);
      showToast('New API key generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate API key.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    showToast('API Key copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="results-page fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const hostname = typeof window !== 'undefined' ? window.location.origin : 'https://resumeats.com';

  const curlCode = `curl -X POST ${hostname}/api/v1/analyze \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  -F "resumeFile=@/path/to/resume.pdf" \\
  -F "jobDescription=Requirements: 3+ years experience with React and TypeScript..."`;

  const nodeCode = `const formData = new FormData();
formData.append('resumeFile', fs.createReadStream('/path/to/resume.pdf'));
formData.append('jobDescription', 'Job description text here...');

fetch('${hostname}/api/v1/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': '${apiKey || 'YOUR_API_KEY'}'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));`;

  return (
    <EnterpriseGate>
      <div className="api-keys-page fade-in">
        <div className="scan-page-header">
          <h2>Developer API Access</h2>
          <p>Integrate ATS resume scanning into your internal ATS system, HR portals, or custom tools.</p>
        </div>

        {/* API Key Panel */}
        <div className="settings-section glass-card" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h3 className="settings-section-title">Your Live API Credentials</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-lg)' }}>
            Keep your API keys confidential. Do not share credentials or expose keys in client-side applications.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                value={apiKey ? apiKey : 'No API key generated yet'} 
                readOnly 
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: apiKey ? '0.05em' : 'normal',
                  background: 'rgba(0,0,0,0.15)',
                  paddingRight: '48px'
                }}
              />
              {apiKey && (
                <button
                  onClick={copyToClipboard}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Copy Key"
                >
                  📋
                </button>
              )}
            </div>
            
            <button 
              className="btn-primary" 
              onClick={generateKey} 
              disabled={generating}
              style={{ minWidth: '180px' }}
            >
              {generating ? 'Generating...' : apiKey ? 'Regenerate Key' : 'Generate API Key'}
            </button>
          </div>
        </div>

        {/* Documentation Section */}
        <div className="settings-section glass-card">
          <h3 className="settings-section-title">API Integration Documentation</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>
            To perform analysis, send a `POST` request with the file attachment to our API endpoint.
          </p>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-xs)' }}>Headers</h4>
            <table className="scan-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Header Key</th>
                  <th style={{ textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>X-API-Key</code></td>
                  <td>Your generated live API access token (e.g. <code>ats_live_...</code>)</td>
                </tr>
                <tr>
                  <td><code>Content-Type</code></td>
                  <td><code>multipart/form-data</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-xs)' }}>cURL Example</h4>
            <div className="code-block-wrapper">
              <pre style={{ margin: 0 }}>{curlCode}</pre>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-xs)' }}>Node.js Example</h4>
            <div className="code-block-wrapper">
              <pre style={{ margin: 0 }}>{nodeCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseGate>
  );
}
