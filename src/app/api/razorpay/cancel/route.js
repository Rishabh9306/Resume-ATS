import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/cancel
 * Cancels the user's active plan and downgrades to free.
 * Since we use Orders (one-time payments) instead of Subscriptions,
 * cancellation simply resets the user's plan in Firestore.
 */
export async function POST(request) {
  try {
    // ── Authenticate ─────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId;
    try {
      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token.' },
        { status: 401 }
      );
    }

    // ── Get user profile ─────────────────────────────────────
    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    if (userData.plan === 'free') {
      return NextResponse.json(
        { error: 'You are already on the free plan.' },
        { status: 400 }
      );
    }

    // ── Downgrade to free ────────────────────────────────────
    await userRef.update({
      plan: 'free',
      subscriptionStatus: 'cancelled',
      razorpayOrderId: null,
      razorpayPaymentId: null,
      pendingPlan: null,
      planDeactivatedAt: new Date(),
    });

    console.log(`Plan cancelled: user=${userId}, previous plan=${userData.plan}`);

    return NextResponse.json({
      success: true,
      message: 'Plan cancelled. You have been downgraded to the free plan.',
    });
  } catch (err) {
    console.error('Cancel plan error:', err);
    return NextResponse.json(
      { error: 'Failed to cancel plan.', details: err.message },
      { status: 500 }
    );
  }
}
