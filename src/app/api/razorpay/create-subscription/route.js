import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import razorpay from '@/lib/razorpay';
import { PLANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/create-subscription
 * Creates a Razorpay Order (Standard Checkout) for the requested plan upgrade.
 */
export async function POST(request) {
  let step = 'init';
  try {
    // ── Step 1: Authenticate ─────────────────────────────────
    step = 'auth_header';
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    step = 'verify_token';
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

    // ── Step 2: Parse body ───────────────────────────────────
    step = 'parse_body';
    const body = await request.json();
    const { planId } = body;

    step = 'validate_plan';
    if (!planId || !PLANS[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID.' },
        { status: 400 }
      );
    }

    if (planId === 'free') {
      return NextResponse.json(
        { error: 'Cannot create a payment for the free plan.' },
        { status: 400 }
      );
    }

    step = 'get_plan_info';
    const planInfo = PLANS[planId];

    // ── Step 3: Get user info ────────────────────────────────
    step = 'fetch_user';
    let userData = { email: '', displayName: 'User' };

    try {
      const adminDb = await getAdminDb();
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        userData = userSnap.data();
      }
    } catch (fsErr) {
      console.warn('Firestore user fetch failed:', fsErr.message);
    }

    // ── Step 4: Create Razorpay Order ────────────────────────
    step = 'create_order';
    let orderId;
    let isMock = false;

    try {
      const order = await razorpay.orders.create({
        amount: planInfo.price * 100,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        notes: {
          userId,
          planId,
          userEmail: userData.email || '',
          planName: planInfo.name,
        },
      });
      orderId = order.id;
    } catch (rzpErr) {
      console.warn('Razorpay Order creation failed:', rzpErr);
      const isAuthError = rzpErr.statusCode === 401 || rzpErr.error === 'Unauthorized';

      if (isAuthError || process.env.NODE_ENV === 'development') {
        orderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
        isMock = true;
      } else {
        throw rzpErr;
      }
    }

    // ── Step 5: Store on user doc ────────────────────────────
    step = 'save_user';
    try {
      const adminDb = await getAdminDb();
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
        razorpayOrderId: orderId,
        pendingPlan: planId,
      }, { merge: true });
    } catch (saveErr) {
      console.warn('Failed to update user doc:', saveErr.message);
    }

    // ── Step 6: Return response ──────────────────────────────
    step = 'respond';
    return NextResponse.json({
      success: true,
      orderId,
      amount: planInfo.price * 100,
      currency: 'INR',
      isMock,
    });
  } catch (err) {
    console.error(`Create order error at step [${step}]:`, err);
    return NextResponse.json(
      { error: 'Failed to create payment order.', step, details: err.message },
      { status: 500 }
    );
  }
}
