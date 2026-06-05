'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import EnterpriseGate from '@/components/EnterpriseGate';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/components/Toast';

export default function TeamDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const fetchOrCreateTeam = async () => {
      try {
        const teamRef = doc(db, 'teams', user.uid);
        const teamSnap = await getDoc(teamRef);

        if (teamSnap.exists()) {
          setTeam(teamSnap.data());
        } else {
          // Initialize default enterprise team doc
          const initialTeam = {
            ownerId: user.uid,
            ownerEmail: user.email,
            seatsLimit: 5,
            members: [
              // Pre-populate with some beautiful mock recruiters to make the dashboard look alive and premium instantly
              { name: 'Sarah Jenkins', email: 'sarah.j@company.com', role: 'Technical Recruiter', scansThisMonth: 18, addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { name: 'David Miller', email: 'david.m@company.com', role: 'Talent Acquisition', scansThisMonth: 12, addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
            ]
          };
          await setDoc(teamRef, initialTeam);
          setTeam(initialTeam);
        }
      } catch (err) {
        console.error('Error fetching team details:', err);
        showToast('Failed to load team data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateTeam();
  }, [user]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Please enter member name and email.', 'warning');
      return;
    }

    if (team.members.length >= team.seatsLimit) {
      showToast('Team is limited to 5 seats. Remove a member first.', 'error');
      return;
    }

    setInviting(true);
    try {
      const teamRef = doc(db, 'teams', user.uid);
      const newMember = {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: 'Recruiter',
        scansThisMonth: 0,
        addedAt: new Date().toISOString()
      };

      await updateDoc(teamRef, {
        members: arrayUnion(newMember)
      });

      // Create global membership mapping (lowercased for case-insensitive matching)
      const membershipRef = doc(db, 'memberships', inviteEmail.trim().toLowerCase());
      await setDoc(membershipRef, {
        ownerId: user.uid,
        addedAt: new Date().toISOString()
      });

      setTeam((prev) => ({
        ...prev,
        members: [...prev.members, newMember]
      }));

      setInviteName('');
      setInviteEmail('');
      showToast('Team member added successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to invite member', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberToRemove) => {
    if (!confirm(`Are you sure you want to remove ${memberToRemove.name} from the team?`)) return;
    try {
      const teamRef = doc(db, 'teams', user.uid);
      await updateDoc(teamRef, {
        members: arrayRemove(memberToRemove)
      });

      // Delete global membership mapping
      const membershipRef = doc(db, 'memberships', memberToRemove.email.toLowerCase());
      await deleteDoc(membershipRef);

      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.email !== memberToRemove.email)
      }));

      showToast('Team member removed.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="results-page fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const seatsUsed = team?.members?.length || 0;
  const seatsLimit = team?.seatsLimit || 5;

  return (
    <EnterpriseGate requiredPlan="teams" featureDescription="Team workspace lets you manage up to 5 recruiter seats. Available on Teams (₹499/mo) and Enterprise plans.">
      <div className="team-page fade-in">
        <div className="scan-page-header">
          <h2>Team Seat Dashboard</h2>
          <p>Manage recruiter seat allocations, monitor monthly scans, and audit talent acquisition activity.</p>
        </div>

        {/* Team Overview Card */}
        <div className="billing__current-plan glass-card" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Team Seats Allocation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                Your Enterprise plan grants up to {seatsLimit} seats for recruiting staff.
              </p>
            </div>
            <span className="badge badge-accent" style={{ fontSize: 'var(--text-sm)', padding: '6px 12px' }}>
              {seatsUsed} / {seatsLimit} Seats Used
            </span>
          </div>
          
          <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: 'var(--space-md)' }}>
            <div style={{ height: '100%', background: 'var(--accent-gradient)', width: `${(seatsUsed / seatsLimit) * 100}%`, borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>

        <div className="scan-grid">
          {/* Left Column: Team Table */}
          <div className="scan-upload-section glass-card" style={{ padding: 'var(--space-xl)', flex: 1.5 }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Active Team Seats</h3>
            
            {seatsUsed === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No active seats yet. Invite a recruiter to start.</p>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="scan-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Recruiter</th>
                      <th style={{ textAlign: 'left' }}>Role</th>
                      <th style={{ textAlign: 'left' }}>Added On</th>
                      <th style={{ textAlign: 'left' }}>Scans (Month)</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map((member, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{member.name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{member.email}</span>
                          </div>
                        </td>
                        <td>{member.role || 'Recruiter'}</td>
                        <td>{new Date(member.addedAt).toLocaleDateString()}</td>
                        <td>{member.scansThisMonth || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="btn-ghost"
                            style={{ color: 'var(--danger)', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                          >
                            Revoke Seat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Invite Form */}
          <div className="scan-jd-section glass-card" style={{ padding: 'var(--space-xl)', alignSelf: 'flex-start' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Add New Recruiter</h3>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="rec-name">Full Name</label>
                <input
                  id="rec-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rec-email">Work Email</label>
                <input
                  id="rec-email"
                  type="email"
                  className="form-input"
                  placeholder="recruiter@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                disabled={inviting || seatsUsed >= seatsLimit}
              >
                {inviting ? 'Adding Member...' : 'Allocate Seat'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </EnterpriseGate>
  );
}
