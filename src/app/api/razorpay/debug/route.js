import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/razorpay/debug
 * Temporary diagnostic endpoint to verify Razorpay SDK connectivity on Vercel.
 * DELETE THIS FILE after debugging.
 */
export async function GET() {
  const diagnostics = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 12)}...` : 'MISSING',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? `set (${process.env.RAZORPAY_KEY_SECRET.length} chars)` : 'MISSING',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.substring(0, 12)}...` : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const Razorpay = require('razorpay');
    diagnostics.sdk_loaded = true;

    const rz = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    diagnostics.sdk_initialized = true;

    const order = await rz.orders.create({
      amount: 100, // ₹1 test
      currency: 'INR',
      receipt: `debug_${Date.now()}`,
    });
    diagnostics.order_created = true;
    diagnostics.order_id = order.id;
  } catch (err) {
    diagnostics.error = err.message;
    diagnostics.error_stack = err.stack?.split('\n').slice(0, 5);
    diagnostics.error_code = err.statusCode || err.code;
    diagnostics.error_description = err.error?.description || err.description;
  }

  return NextResponse.json(diagnostics);
}
