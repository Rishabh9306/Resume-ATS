import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import razorpay from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/cancel
 * Cancels the user's active Razorpay subscription (at end of current period).
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

    // ── Get user's subscription ──────────────────────────────
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
    const subscriptionId = userData.razorpaySubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found.' },
        { status: 400 }
      );
    }

    // ── Cancel on Razorpay (at end of current period) ────────
    await razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });

    // Update user doc to reflect pending cancellation
    await userRef.update({
      subscriptionStatus: 'pending_cancellation',
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period. You will retain access until then.',
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json(
      { error: 'Failed to cancel subscription.', details: err.message },
      { status: 500 }
    );
  }
}
