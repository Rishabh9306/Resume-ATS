let _instance = null;

function getRazorpay() {
  if (_instance) return _instance;
  // Dynamic require to avoid build-time initialization
  const Razorpay = require('razorpay');
  _instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return _instance;
}

// Proxy so callers can use `razorpay.subscriptions.create(...)` seamlessly
const razorpay = new Proxy({}, {
  get(_, prop) {
    return getRazorpay()[prop];
  }
});

export default razorpay;
