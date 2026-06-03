import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/webhook
 * Razorpay webhook handler. Verifies signature and processes payment events.
 * Supports both Order-based (Standard Checkout) and Subscription events.
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
    if (!webhookSecret || webhookSecret === 'your_webhook_secret_here') {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured properly. Skipping signature check in test mode.');
      // In test mode, allow through without verification
    } else {
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
    }

    // ── Process event ────────────────────────────────────────
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`Razorpay webhook received: ${eventType}`);

    const adminDb = await getAdminDb();

    // ── Handle Order/Payment events (Standard Checkout) ─────
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const notes = payment?.notes || order?.notes || {};
      const userId = notes.userId;
      const planId = notes.planId;

      if (!userId || !planId) {
        console.warn(`Webhook ${eventType}: missing userId or planId in notes`);
        return NextResponse.json({ status: 'ignored — no userId/planId' });
      }

      const userRef = adminDb.collection('users').doc(userId);
      const now = new Date();
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await userRef.set({
        plan: planId,
        subscriptionStatus: 'active',
        razorpayOrderId: order?.id || payment?.order_id,
        razorpayPaymentId: payment?.id,
        pendingPlan: null,
        scansUsed: 0,
        scansResetDate: nextReset,
        planActivatedAt: now,
      }, { merge: true });

      console.log(`Payment captured via webhook: user=${userId}, plan=${planId}`);
      return NextResponse.json({ status: 'ok' });
    }

    // ── Handle Subscription events (if Subscriptions are enabled later) ──
    if (eventType.startsWith('subscription.')) {
      const payload = event.payload?.subscription?.entity;
      if (!payload) {
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

      const userRef = adminDb.collection('users').doc(userId);

      switch (eventType) {
        case 'subscription.activated': {
          const now = new Date();
          const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

          await userRef.set({
            plan: planId || 'pro',
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
          console.log(`Unhandled subscription event: ${eventType}`);
      }

      return NextResponse.json({ status: 'ok' });
    }

    console.log(`Unhandled webhook event type: ${eventType}`);
    return NextResponse.json({ status: 'ignored' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Always return 200 for webhooks to prevent retries on processing errors
    return NextResponse.json({ status: 'error', message: err.message }, { status: 200 });
  }
}
