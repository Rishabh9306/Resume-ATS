let _admin = null;
let _app = null;
let _db = null;
let _auth = null;

async function getAdmin() {
  if (!_admin) {
    const mod = await import('firebase-admin');
    _admin = mod.default || mod;
  }
  return _admin;
}

async function getAdminApp() {
  const admin = await getAdmin();
  if (_app) return _app;
  if (admin.apps.length > 0) {
    _app = admin.apps[0];
    return _app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  _app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
  return _app;
}

export async function getAdminDb() {
  if (_db) return _db;
  const admin = await getAdmin();
  const app = await getAdminApp();
  _db = admin.firestore(app);
  _db.settings({ databaseId: 'default' });
  return _db;
}

export async function getAdminAuth() {
  if (_auth) return _auth;
  const admin = await getAdmin();
  const app = await getAdminApp();
  _auth = admin.auth(app);
  return _auth;
}
