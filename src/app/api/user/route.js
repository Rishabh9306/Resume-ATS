import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Helper: extract and verify Firebase token from Authorization header.
 * Returns { userId } on success, or a NextResponse error.
 */
async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const adminAuth = await getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    return { userId: decoded.uid };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired authentication token.' },
        { status: 401 }
      ),
    };
  }
}

/**
 * GET /api/user
 * Returns the authenticated user's profile from Firestore.
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(auth.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    // Don't return sensitive internal fields
    const profile = {
      uid: auth.userId,
      email: userData.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL || '',
      plan: userData.plan || 'free',
      scansUsed: userData.scansUsed || 0,
      scansResetDate: userData.scansResetDate || null,
      subscriptionStatus: userData.subscriptionStatus || null,
      createdAt: userData.createdAt || null,
    };

    return NextResponse.json({ success: true, user: profile });
  } catch (err) {
    console.error('Get user error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch user profile.', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user
 * Updates user profile fields (displayName, emailPreferences).
 */
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { displayName, emailPreferences } = body;

    // Build update object — only allow whitelisted fields
    const updates = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length > 100) {
        return NextResponse.json(
          { error: 'displayName must be a string (max 100 characters).' },
          { status: 400 }
        );
      }
      updates.displayName = displayName.trim();
    }

    if (emailPreferences !== undefined) {
      if (typeof emailPreferences !== 'object') {
        return NextResponse.json(
          { error: 'emailPreferences must be an object.' },
          { status: 400 }
        );
      }
      // Only allow known preference keys
      const allowedPrefs = ['scanReports', 'productUpdates', 'tips'];
      const sanitised = {};
      for (const key of allowedPrefs) {
        if (typeof emailPreferences[key] === 'boolean') {
          sanitised[key] = emailPreferences[key];
        }
      }
      updates.emailPreferences = sanitised;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(auth.userId);
    await userRef.set(updates, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      updated: Object.keys(updates).filter((k) => k !== 'updatedAt'),
    });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json(
      { error: 'Failed to update user profile.', details: err.message },
      { status: 500 }
    );
  }
}
