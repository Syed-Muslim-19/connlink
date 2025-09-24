import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('🔄 Setting up Stripe products and prices...');

    // Create a product
    const product = await stripe.products.create({
      name: 'ConnLink Premium Verification',
      description: 'Get verified with a blue checkmark and premium features',
      images: ['https://via.placeholder.com/200x200?text=Premium'],
      metadata: {
        app: 'connlink',
        type: 'verification'
      }
    });

    console.log('✅ Created product:', product.id);

    // Create a recurring price (monthly subscription)
    const price = await stripe.prices.create({
      currency: 'usd',
      product: product.id,
      recurring: {
        interval: 'month',
      },
      unit_amount: 999, // $9.99 in cents
    });

    console.log('✅ Created monthly price:', price.id);

    console.log('\n🎉 Setup complete!');
    console.log('\nAdd this to your .env file:');
    console.log(`STRIPE_PRICE_ID=${price.id}`);
    console.log('\nProduct details:');
    console.log(`- Product ID: ${product.id}`);
    console.log(`- Price ID: ${price.id}`);
    console.log(`- Amount: $9.99/month`);

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
  }
}

setupStripeProducts();