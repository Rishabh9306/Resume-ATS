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
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log(`Bypassing Razorpay cancel for mock subscription. Resetting user to free plan.`);
      await userRef.update({
        plan: 'free',
        subscriptionStatus: 'cancelled',
        razorpaySubscriptionId: null,
      });
    } else {
      try {
        await razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
        await userRef.update({
          subscriptionStatus: 'pending_cancellation',
        });
      } catch (cancelErr) {
        if (subscriptionId.includes('mock') || process.env.NODE_ENV === 'development') {
          console.warn('Ignoring Razorpay API cancel failure for mock key:', cancelErr.message);
          await userRef.update({
            plan: 'free',
            subscriptionStatus: 'cancelled',
            razorpaySubscriptionId: null,
          });
        } else {
          throw cancelErr;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled.',
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json(
      { error: 'Failed to cancel subscription.', details: err.message },
      { status: 500 }
    );
  }
}
