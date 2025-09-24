import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

async function testStripe() {
  try {
    console.log('🔄 Testing Stripe configuration...');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Test 1: Check if we can access Stripe API
    console.log('📋 Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
    console.log('📋 Stripe Price ID:', process.env.STRIPE_PRICE_ID);

    // Test 2: Try to retrieve the price
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    console.log('✅ Price retrieved successfully:');
    console.log(`  - ID: ${price.id}`);
    console.log(`  - Amount: $${price.unit_amount / 100}`);
    console.log(`  - Currency: ${price.currency}`);
    console.log(`  - Interval: ${price.recurring?.interval}`);

    // Test 3: Try to create a test customer
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: { test: 'true' }
    });
    console.log('✅ Test customer created:', testCustomer.id);

    // Clean up test customer
    await stripe.customers.del(testCustomer.id);
    console.log('✅ Test customer deleted');

    console.log('🎉 All Stripe tests passed!');

  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    console.error('❌ Error type:', error.type);
    console.error('❌ Error code:', error.code);
  }
}

testStripe();