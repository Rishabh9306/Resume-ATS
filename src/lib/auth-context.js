'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);

const DEFAULT_USER_DATA = {
  plan: 'free',
  scansUsed: 0,
  scansResetDate: null,
  createdAt: null,
};

/**
 * Fetch the user document from Firestore, or create one for new users.
 * Also performs membership checks to inherit subscription plans from team owners.
 */
async function fetchOrCreateUserDoc(firebaseUser) {
  if (!db) return { uid: firebaseUser.uid, ...DEFAULT_USER_DATA };
  
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);
  let baseData = snap.exists() ? snap.data() : null;

  const userEmail = firebaseUser.email?.toLowerCase();
  let teamOwnerId = null;
  let inheritedPlan = 'free';

  if (userEmail) {
    const membershipRef = doc(db, 'memberships', userEmail);
    const membershipSnap = await getDoc(membershipRef);
    if (membershipSnap.exists()) {
      teamOwnerId = membershipSnap.data().ownerId;
      const ownerRef = doc(db, 'users', teamOwnerId);
      const ownerSnap = await getDoc(ownerRef);
      if (ownerSnap.exists()) {
        inheritedPlan = ownerSnap.data().plan || 'free';
      }
    }
  }

  const now = new Date();
  
  if (!baseData) {
    // New user — create default document with potential inherited plan
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // first of next month
    baseData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      plan: teamOwnerId ? inheritedPlan : 'free',
      teamOwnerId: teamOwnerId || null,
      scansUsed: 0,
      scansResetDate: resetDate,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, baseData);
    return { ...baseData, createdAt: now };
  }

  // Existing user — check if team membership status has changed
  const currentPlan = baseData.plan || 'free';
  const currentOwner = baseData.teamOwnerId || null;

  if (teamOwnerId) {
    if (currentOwner !== teamOwnerId || currentPlan !== inheritedPlan) {
      const updates = { teamOwnerId, plan: inheritedPlan };
      await setDoc(userRef, updates, { merge: true });
      baseData = { ...baseData, ...updates };
    }
  } else {
    // If user was previously in a team but is no longer mapped
    if (currentOwner !== null) {
      const updates = { teamOwnerId: null, plan: 'free' };
      await setDoc(userRef, updates, { merge: true });
      baseData = { ...baseData, ...updates };
    }
  }

  return { uid: firebaseUser.uid, ...baseData };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const data = await fetchOrCreateUserDoc(firebaseUser);
          setUserData(data);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }, []);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  }, []);

  const signOutUser = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchOrCreateUserDoc(user);
      setUserData(data);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }, [user]);

  const value = {
    user,
    userData,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: signOutUser,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
