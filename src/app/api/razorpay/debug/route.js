import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/razorpay/debug
 * Temporary diagnostic endpoint. DELETE after debugging.
 */
export async function GET() {
  const d = { steps: {} };

  // Step 1: Env vars
  d.steps.env = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.slice(0, 9)}... (len: ${process.env.RAZORPAY_KEY_ID.length})` : 'MISSING',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.slice(0, 4)}... (len: ${process.env.RAZORPAY_KEY_SECRET.length})` : 'MISSING',
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID ? 'set' : 'MISSING',
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'set' : 'MISSING',
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? `set (${process.env.FIREBASE_ADMIN_PRIVATE_KEY.length} chars)` : 'MISSING',
  };

  // Step 2: Firebase Admin Auth
  try {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const auth = await getAdminAuth();
    d.steps.firebase_auth = 'ok';
  } catch (err) {
    d.steps.firebase_auth = { error: err.message, stack: err.stack?.split('\n').slice(0, 3) };
  }

  // Step 3: Firebase Admin Firestore
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = await getAdminDb();
    d.steps.firebase_firestore = 'ok';
  } catch (err) {
    d.steps.firebase_firestore = { error: err.message, stack: err.stack?.split('\n').slice(0, 3) };
  }

  // Step 4: Razorpay SDK
  try {
    const Razorpay = require('razorpay');
    const rz = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await rz.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: `debug_${Date.now()}`,
    });
    d.steps.razorpay_order = { ok: true, order_id: order.id };
  } catch (err) {
    d.steps.razorpay_order = {
      error: err.message || err.description || err.error?.description || String(err),
      statusCode: err.statusCode,
      raw: err
    };
  }

  // Step 4b: Direct fetch test to isolate SDK issues
  try {
    const authStr = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authStr}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: `debug_direct_${Date.now()}`
      })
    });
    const resData = await res.json();
    d.steps.razorpay_direct_fetch = {
      status: res.status,
      ok: res.ok,
      data: resData
    };
  } catch (err) {
    d.steps.razorpay_direct_fetch = { error: err.message };
  }

  // Step 5: Simulate the exact flow from create-subscription (without auth)
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = await getAdminDb();
    // Try a simple read to verify Firestore connectivity
    const testDoc = await db.collection('users').limit(1).get();
    d.steps.firestore_read = { ok: true, doc_count: testDoc.size };
  } catch (err) {
    d.steps.firestore_read = { error: err.message, code: err.code };
  }

  // Step 6: Test Firestore settings call (potential issue)
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = await getAdminDb();
    d.steps.firestore_settings = 'ok';
  } catch (err) {
    d.steps.firestore_settings = { error: err.message };
  }

  return NextResponse.json(d, { status: 200 });
}
