'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/scan': 'New Scan',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const notifRef = useRef(null);

  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard/results')) return 'Scan Results';
    return PAGE_TITLES[pathname] || 'Dashboard';
  };

  useEffect(() => {
    if (!user || !db) {
      setLoadingScans(false);
      return;
    }

    const fetchScans = async () => {
      try {
        const scansRef = collection(db, 'scans');
        const q = query(
          scansRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const scanData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScans(scanData);
        if (scanData.length > 0) {
          setHasUnread(true);
        }
      } catch (err) {
        console.error('Error fetching notification scans:', err);
      } finally {
        setLoadingScans(false);
      }
    };

    fetchScans();
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    if (!notifDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="dashboard__main">
          <header className="dashboard__topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <button
                className="dashboard-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Toggle sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xl)',
                  cursor: 'pointer',
                  display: 'none', // Managed by responsive media queries in CSS
                }}
              >
                ☰
              </button>
              <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                {getPageTitle()}
              </h2>
            </div>

            <div className="dashboard__topbar-actions" ref={notifRef}>
              <button 
                className="dashboard__topbar-icon" 
                aria-label="Notifications" 
                style={{ background: 'none', border: 'none', position: 'relative' }}
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setHasUnread(false);
                }}
              >
                🔔
                {hasUnread && <span className="notification-dot" />}
              </button>

              {notifDropdownOpen && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown__header">
                    <h4 className="notification-dropdown__title">Latest Activity Updates</h4>
                    <button 
                      className="notification-dropdown__clear"
                      onClick={() => setScans([])}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="notification-dropdown__list">
                    {loadingScans ? (
                      <div className="notification-dropdown__empty">Loading...</div>
                    ) : scans.length === 0 ? (
                      <div className="notification-dropdown__empty">No recent scans.</div>
                    ) : (
                      scans.map((scan) => (
                        <div key={scan.id} className="notification-dropdown__item">
                          <p className="notification-dropdown__item-text">
                            Scanned resume for <strong>{scan.jobTitle || 'Unknown Position'}</strong> (Score: <strong>{Math.round(scan.score)}%</strong>)
                          </p>
                          <span className="notification-dropdown__item-time">
                            {formatTime(scan.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="dashboard__content">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
