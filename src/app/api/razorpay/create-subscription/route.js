import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import razorpay from '@/lib/razorpay';
import { PLANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// In-memory cache for dynamically created plans
const PLAN_CACHE = {};

async function getOrCreateRazorpayPlanId(planId) {
  const envKey = `RAZORPAY_PLAN_${planId.toUpperCase()}`;
  let razorpayPlanId = process.env[envKey];

  // If it's a valid ID (not a placeholder), use it directly
  if (razorpayPlanId && !razorpayPlanId.includes('placeholder')) {
    return razorpayPlanId;
  }

  // Check in-memory cache
  if (PLAN_CACHE[planId]) {
    return PLAN_CACHE[planId];
  }

  // Check Firestore config (if DB is online)
  let adminDb = null;
  try {
    adminDb = await getAdminDb();
    const configSnap = await adminDb.collection('settings').doc('razorpay_plans').get();
    if (configSnap.exists) {
      const data = configSnap.data();
      if (data[planId]) {
        PLAN_CACHE[planId] = data[planId];
        return data[planId];
      }
    }
  } catch (fsErr) {
    console.warn('Firestore plan cache fetch failed:', fsErr.message);
  }

  // Create the plan dynamically in Razorpay
  const planInfo = PLANS[planId];
  if (!planInfo) {
    throw new Error(`Plan details not found for ID: ${planId}`);
  }

  console.log(`Creating Razorpay plan dynamically for: ${planId} (${planInfo.name})`);
  try {
    const createdPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: `ResumeATS Pro - ${planInfo.name} Plan`,
        amount: planInfo.price * 100, // Amount in paise
        currency: 'INR',
        description: planInfo.features.slice(0, 3).join(', '),
      },
    });

    // Store in cache
    PLAN_CACHE[planId] = createdPlan.id;

    // Save to Firestore (if DB is online)
    if (adminDb) {
      try {
        await adminDb.collection('settings').doc('razorpay_plans').set({
          [planId]: createdPlan.id
        }, { merge: true });
      } catch (saveErr) {
        console.warn('Failed to save created plan to Firestore:', saveErr.message);
      }
    }

    return createdPlan.id;
  } catch (rzpErr) {
    console.warn(`Razorpay plan creation failed, checking if we can use a mock plan ID:`, rzpErr.message);
    const isAuthError = rzpErr.statusCode === 401 || rzpErr.error === 'Unauthorized';
    if (isAuthError || process.env.NODE_ENV === 'development') {
      const mockPlanId = `plan_mock_${planId}`;
      PLAN_CACHE[planId] = mockPlanId;
      return mockPlanId;
    }
    throw rzpErr;
  }
}

/**
 * POST /api/razorpay/create-subscription
 * Creates a Razorpay subscription for the requested plan.
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
        { error: 'Cannot create a subscription for the free plan.' },
        { status: 400 }
      );
    }

    let razorpayPlanId;
    try {
      razorpayPlanId = await getOrCreateRazorpayPlanId(planId);
    } catch (planErr) {
      console.error('Plan resolution error:', planErr);
      const errMsg = planErr.message || planErr.error?.description || planErr.description || (typeof planErr.error === 'string' ? planErr.error : '') || JSON.stringify(planErr) || 'Unknown Razorpay error';
      return NextResponse.json(
        { error: `Razorpay plan could not be resolved or created: ${errMsg}` },
        { status: 500 }
      );
    }

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

    // ── Create Razorpay subscription ─────────────────────────
    let subscriptionId;
    let shortUrl;
    let isMock = false;

    const isMockPlan = razorpayPlanId.startsWith('plan_mock_');

    if (isMockPlan) {
      subscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 11)}`;
      shortUrl = '#';
      isMock = true;
      console.log(`Bypassed Razorpay API using Developer Mock Mode (mock plan): subscriptionId=${subscriptionId}`);
    } else {
      try {
        const subscription = await razorpay.subscriptions.create({
          plan_id: razorpayPlanId,
          customer_notify: 1,
          total_count: 12, // 12 billing cycles
          notes: {
            userId,
            planId,
            userEmail: userData.email || '',
          },
        });
        subscriptionId = subscription.id;
        shortUrl = subscription.short_url;
      } catch (rzpErr) {
        console.warn('Razorpay API failed, checking for local testing fallback:', rzpErr);
        const isAuthError = rzpErr.statusCode === 401 || rzpErr.error === 'Unauthorized';
        
        // Fallback in development mode or on auth errors (invalid keys)
        if (isAuthError || process.env.NODE_ENV === 'development') {
          subscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 11)}`;
          shortUrl = '#';
          isMock = true;
          console.log(`Bypassed Razorpay API using Developer Mock Mode: subscriptionId=${subscriptionId}`);
        } else {
          throw rzpErr;
        }
      }
    }

    // Store subscription ID on user doc for reference (graceful if fails)
    try {
      const adminDb = await getAdminDb();
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
        razorpaySubscriptionId: subscriptionId,
        pendingPlan: planId,
      }, { merge: true });
    } catch (saveErr) {
      console.warn('Failed to update user doc with subscription ID:', saveErr.message);
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      shortUrl,
      isMock,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return NextResponse.json(
      { error: 'Failed to create subscription.', details: err.message },
      { status: 500 }
    );
  }
}
