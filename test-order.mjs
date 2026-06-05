import fs from 'fs';
import path from 'path';
import Razorpay from 'razorpay';

// Better parser for .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  const lines = envConfig.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index !== -1) {
      const key = line.slice(0, index).trim();
      let val = line.slice(index + 1).trim();
      // remove surrounding quotes
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('Testing Razorpay Order Creation with:');
console.log('RAZORPAY_KEY_ID:', key_id);
console.log('RAZORPAY_KEY_SECRET length:', key_secret ? key_secret.length : 0);

if (!key_id || !key_secret) {
  console.error('Missing Razorpay credentials in .env.local');
  process.exit(1);
}

const rzp = new Razorpay({
  key_id,
  key_secret,
});

async function testOrder() {
  try {
    const order = await rzp.orders.create({
      amount: 100, // 1 INR (100 paise)
      currency: 'INR',
      receipt: `rcpt_test_${Date.now()}`,
      notes: {
        userId: 'test_user_id',
        planId: 'pro',
      }
    });
    console.log('✅ Success! Order ID:', order.id);
    console.log('Full Order object:', order);
  } catch (err) {
    console.error('❌ Failed to create order!');
    console.error(err);
  }
}

testOrder();
