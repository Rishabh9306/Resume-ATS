'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, userData, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(userData?.displayName || user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const [brandName, setBrandName] = useState(userData?.brandName || '');
  const [brandLogo, setBrandLogo] = useState(userData?.brandLogo || '');
  const [savingBranding, setSavingBranding] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    email: userData?.notifications?.email ?? true,
    updates: userData?.notifications?.updates ?? true,
    tips: userData?.notifications?.tips ?? true,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName, notifications });
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { brandName, brandLogo });
      showToast('Branding settings updated!', 'success');
    } catch (err) {
      showToast('Failed to update branding settings', 'error');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed!', 'success');
    } catch (err) {
      showToast(err.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      showToast('Account deleted', 'info');
      router.push('/');
    } catch (err) {
      showToast('Failed to delete account. You may need to sign in again.', 'error');
    }
  };

  const initials = (displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="settings-page fade-in">
      {/* Profile Section */}
      <div className="settings-section glass-card">
        <h3 className="settings-section-title">Profile</h3>
        <div className="settings-profile-row">
          <div className="settings-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="settings-profile-fields">
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className="btn-secondary" 
            onClick={async () => {
              try {
                await signOut();
                router.push('/login');
              } catch (err) {
                showToast('Failed to log out', 'error');
              }
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Password Section */}
      {user?.providerData?.[0]?.providerId === 'password' && (
        <div className="settings-section glass-card">
          <h3 className="settings-section-title">Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications */}
      <div className="settings-section glass-card">
        <h3 className="settings-section-title">Notifications</h3>
        {[
          { key: 'email', label: 'Email notifications', desc: 'Receive scan results and account updates' },
          { key: 'updates', label: 'Product updates', desc: 'New features and improvements' },
          { key: 'tips', label: 'Resume tips', desc: 'Weekly tips to improve your resume' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">{label}</div>
              <div className="settings-toggle-desc">{desc}</div>
            </div>
            <button
              className={`toggle-switch ${notifications[key] ? 'toggle-switch--active' : ''}`}
              onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
              aria-label={`Toggle ${label}`}
            >
              <span className="toggle-switch-knob" />
            </button>
          </div>
        ))}
        <button className="btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ marginTop: 'var(--space-lg)' }}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Enterprise Custom Branding */}
      {userData?.plan === 'enterprise' && (
        <div className="settings-section glass-card">
          <h3 className="settings-section-title">🏢 Enterprise Custom Branding</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
            Customize exported PDF report templates and candidate dashboard elements with your company branding.
          </p>
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Company Brand Name</label>
            <input 
              className="form-input" 
              value={brandName} 
              onChange={(e) => setBrandName(e.target.value)} 
              placeholder="e.g. Acme Corporation"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Company Logo URL / Header Text</label>
            <input 
              className="form-input" 
              value={brandLogo} 
              onChange={(e) => setBrandLogo(e.target.value)} 
              placeholder="e.g. https://company.com/logo.png or Acme Recruiting"
            />
          </div>
          <button className="btn-primary" onClick={handleSaveBranding} disabled={savingBranding}>
            {savingBranding ? 'Saving...' : 'Save Branding Preferences'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="settings-section glass-card danger-zone">
        <h3 className="settings-section-title" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
        {showDeleteConfirm ? (
          <div className="danger-confirm">
            <p><strong>Are you absolutely sure?</strong></p>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={handleDeleteAccount}>Yes, Delete My Account</button>
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', marginTop: 'var(--space-md)' }} onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
