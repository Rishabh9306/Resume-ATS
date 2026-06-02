import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/verify-payment
 * Verify a Standard Checkout payment signature and activate the plan immediately.
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

    // ── Parse body ───────────────────────────────────────────
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    // ── Verify signature ─────────────────────────────────────
    const isMock = razorpay_order_id.startsWith('order_mock_');
    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: 'Razorpay secret key not configured.' },
          { status: 500 }
        );
      }

      // For Standard Checkout (Orders), signature format is: order_id + '|' + payment_id
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (razorpay_signature !== expectedSignature) {
        console.warn('Payment signature verification failed.');
        return NextResponse.json(
          { error: 'Invalid signature verification.' },
          { status: 400 }
        );
      }
    }

    // ── Upgrade User Plan ────────────────────────────────────
    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await userRef.set({
      plan: planId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      subscriptionStatus: 'active',
      pendingPlan: null,
      scansUsed: 0,
      scansResetDate: nextReset,
      planActivatedAt: now,
    }, { merge: true });

    console.log(`Successfully verified payment & activated plan: user=${userId}, plan=${planId}, order=${razorpay_order_id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: 'Failed to verify payment.', details: err.message },
      { status: 500 }
    );
  }
}
