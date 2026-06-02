import admin from 'firebase-admin';

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  }),
});

async function run() {
  try {
    console.log("Configuring Firestore settings with databaseId: 'default'...");
    const db = admin.firestore(app);
    db.settings({ databaseId: 'default' }); // Explicitly set named database ID

    console.log('Writing test document to "test_connection/verification"...');
    const docRef = db.collection('test_connection').doc('verification');
    await docRef.set({
      verified: true,
      timestamp: new Date(),
      message: 'Explicit settings connection works!'
    });
    console.log('✅ Write successful!');

    console.log('Reading test document back...');
    const snap = await docRef.get();
    if (snap.exists) {
      console.log('✅ Read successful! Document data:', snap.data());
    } else {
      console.error('❌ Document not found after write!');
    }

    // Clean up
    console.log('Cleaning up test document...');
    await docRef.delete();
    console.log('✅ Cleanup complete. Named database is fully functional!');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
}

run();
