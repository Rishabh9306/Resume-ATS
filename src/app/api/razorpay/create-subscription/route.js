import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import razorpay from '@/lib/razorpay';
import { PLANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/create-subscription
 * Creates a Razorpay Order (Standard Checkout) for the requested plan upgrade.
 * Uses Orders API instead of Subscriptions API for broader test-mode compatibility.
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
    const { planId } = body;

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

    const planInfo = PLANS[planId];

    // ── Get user info ────────────────────────────────────────
    let userData = { email: '', displayName: 'User' };
    let hasUserDoc = false;

    try {
      const adminDb = await getAdminDb();
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        userData = userSnap.data();
        hasUserDoc = true;
      }
    } catch (fsErr) {
      console.warn('Firestore user fetch failed, using Auth fallback:', fsErr.message);
    }

    // If Firestore failed or user doc doesn't exist, fallback to Firebase Auth profile
    if (!hasUserDoc) {
      try {
        const adminAuth = await getAdminAuth();
        const userAuthData = await adminAuth.getUser(userId);
        userData = {
          email: userAuthData.email || '',
          displayName: userAuthData.displayName || 'User',
        };
      } catch (authErr) {
        console.warn('Auth user fetch failed:', authErr.message);
      }
    }

    // ── Create Razorpay Order (Standard Checkout) ────────────
    let orderId;
    let isMock = false;

    try {
      const order = await razorpay.orders.create({
        amount: planInfo.price * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${planId}_${userId}_${Date.now()}`,
        notes: {
          userId,
          planId,
          userEmail: userData.email || '',
          planName: planInfo.name,
        },
      });
      orderId = order.id;
      console.log(`Razorpay Order created: ${orderId} for plan ${planId}, amount ₹${planInfo.price}`);
    } catch (rzpErr) {
      console.warn('Razorpay Order creation failed:', rzpErr);
      const isAuthError = rzpErr.statusCode === 401 || rzpErr.error === 'Unauthorized';

      // Fallback to mock mode only in development or on auth errors
      if (isAuthError || process.env.NODE_ENV === 'development') {
        orderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
        isMock = true;
        console.log(`Bypassed Razorpay API using Developer Mock Mode: orderId=${orderId}`);
      } else {
        throw rzpErr;
      }
    }

    // Store pending order info on user doc for reference
    try {
      const adminDb = await getAdminDb();
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
        razorpayOrderId: orderId,
        pendingPlan: planId,
      }, { merge: true });
    } catch (saveErr) {
      console.warn('Failed to update user doc with order ID:', saveErr.message);
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: planInfo.price * 100,
      currency: 'INR',
      isMock,
    });
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json(
      { error: 'Failed to create payment order.', details: err.message },
      { status: 500 }
    );
  }
}
