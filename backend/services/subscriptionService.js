import { User } from '../models/user.model.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const checkExpiredSubscriptions = async () => {
  try {
    console.log('🔄 Checking for expired subscriptions...');

    const now = new Date();

    // Find users with active subscriptions that should be expired
    const usersWithExpiredSubs = await User.find({
      'subscription.status': 'active',
      'subscription.endDate': { $lt: now },
      isVerified: true
    });

    console.log(`📊 Found ${usersWithExpiredSubs.length} users with expired subscriptions`);

    for (const user of usersWithExpiredSubs) {
      try {
        // Double check with Stripe if the subscription is still active
        if (user.subscription.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            user.subscription.stripeSubscriptionId
          );

          // If Stripe says it's still active, update our local data
          if (stripeSubscription.status === 'active') {
            await User.findByIdAndUpdate(user._id, {
              'subscription.status': 'active',
              'subscription.endDate': new Date(stripeSubscription.current_period_end * 1000),
              isVerified: true
            });
            console.log(`✅ Updated subscription for user ${user.username} - still active on Stripe`);
            continue;
          }
        }

        // Mark user as unverified and update subscription status
        await User.findByIdAndUpdate(user._id, {
          isVerified: false,
          'subscription.status': 'inactive'
        });

        console.log(`❌ Deactivated subscription for user ${user.username}`);
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
      }
    }

    console.log('✅ Subscription check completed');
  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error);
  }
};

export const syncSubscriptionWithStripe = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.subscription.stripeSubscriptionId) {
      return null;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );

    const updateData = {
      'subscription.status': stripeSubscription.status,
      'subscription.endDate': new Date(stripeSubscription.current_period_end * 1000)
    };

    if (stripeSubscription.status === 'active') {
      updateData.isVerified = true;
    } else if (['canceled', 'incomplete_expired', 'past_due'].includes(stripeSubscription.status)) {
      updateData.isVerified = false;
    }

    await User.findByIdAndUpdate(userId, updateData);

    return stripeSubscription;
  } catch (error) {
    console.error('Error syncing subscription with Stripe:', error);
    throw error;
  }
};

export const startSubscriptionChecker = () => {
  // Check expired subscriptions every hour
  const checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds

  console.log('🚀 Starting subscription checker - will run every hour');

  // Run immediately on startup (with error handling)
  checkExpiredSubscriptions().catch(error => {
    console.error('❌ Initial subscription check failed:', error);
  });

  // Then run every hour (with error handling)
  setInterval(() => {
    checkExpiredSubscriptions().catch(error => {
      console.error('❌ Scheduled subscription check failed:', error);
    });
  }, checkInterval);
};