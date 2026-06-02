import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization — only init when API key is available (skips during build/SSR prerender)
let _app, _auth, _db;

function getFirebaseApp() {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
  } else {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

export const app = typeof window !== 'undefined' && firebaseConfig.apiKey
  ? getFirebaseApp()
  : null;

export const auth = typeof window !== 'undefined' && firebaseConfig.apiKey
  ? getAuth(getFirebaseApp())
  : null;

export const db = typeof window !== 'undefined' && firebaseConfig.apiKey
  ? getFirestore(getFirebaseApp(), 'default')
  : null;
