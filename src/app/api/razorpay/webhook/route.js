import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/webhook
 * Razorpay webhook handler. Verifies signature and processes subscription events.
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature.' },
        { status: 400 }
      );
    }

    // ── Verify signature ─────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json(
        { error: 'Webhook secret not configured.' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Invalid Razorpay webhook signature.');
      return NextResponse.json(
        { error: 'Invalid signature.' },
        { status: 400 }
      );
    }

    // ── Process event ────────────────────────────────────────
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload?.subscription?.entity;

    if (!payload) {
      // Not a subscription event we care about
      return NextResponse.json({ status: 'ignored' });
    }

    const subscriptionId = payload.id;
    const notes = payload.notes || {};
    const userId = notes.userId;
    const planId = notes.planId;

    if (!userId) {
      console.warn('Webhook received without userId in notes:', subscriptionId);
      return NextResponse.json({ status: 'ignored — no userId' });
    }

    const adminDb = await getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);

    switch (eventType) {
      case 'subscription.activated': {
        // Subscription is now active — upgrade user's plan
        const now = new Date();
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await userRef.set({
          plan: planId || 'starter',
          razorpaySubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          pendingPlan: null,
          scansUsed: 0,
          scansResetDate: nextReset,
          planActivatedAt: now,
        }, { merge: true });

        console.log(`Subscription activated: user=${userId}, plan=${planId}`);
        break;
      }

      case 'subscription.charged': {
        // Recurring charge succeeded — reset monthly scan counter
        const now = new Date();
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await userRef.set({
          subscriptionStatus: 'active',
          scansUsed: 0,
          scansResetDate: nextReset,
          lastChargedAt: now,
        }, { merge: true });

        console.log(`Subscription charged: user=${userId}`);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        // Subscription ended — downgrade to free at end of period
        await userRef.set({
          plan: 'free',
          subscriptionStatus: eventType === 'subscription.cancelled' ? 'cancelled' : 'completed',
          razorpaySubscriptionId: null,
          pendingPlan: null,
          planDeactivatedAt: new Date(),
        }, { merge: true });

        console.log(`Subscription ${eventType}: user=${userId}, downgraded to free`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Always return 200 for webhooks to prevent retries on processing errors
    return NextResponse.json({ status: 'error', message: err.message }, { status: 200 });
  }
}
