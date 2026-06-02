import Razorpay from 'razorpay';

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testPlanCreation() {
  try {
    console.log('Testing Razorpay plan creation with Key ID:', process.env.RAZORPAY_KEY_ID);
    const plan = await rzp.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'ResumeATS Pro - Test Plan',
        amount: 29900, // 299 INR
        currency: 'INR',
        description: 'Test features description'
      }
    });
    console.log('✅ Razorpay Plan created successfully! Plan ID:', plan.id);
  } catch (err) {
    console.error('❌ Razorpay Plan creation failed!');
    console.error('Raw Error Object:', JSON.stringify(err, null, 2));
    console.error('Error properties:', Object.keys(err));
    console.error('Extracted description:', err.message || err.error?.description || err.description);
  }
}

testPlanCreation();
