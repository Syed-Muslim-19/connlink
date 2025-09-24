import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

async function forceMigrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find ALL users to ensure complete migration
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users`);

    // Force update every user
    for (const user of allUsers) {
      console.log(`\n🔄 Processing user: ${user.username} (${user._id})`);
      console.log(`   Current subscription:`, user.subscription);
      console.log(`   Current isVerified:`, user.isVerified);

      // Force set the subscription and verification fields
      const updateResult = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            isVerified: user.isVerified || false,
            subscription: {
              stripeCustomerId: user.subscription?.stripeCustomerId || null,
              stripeSubscriptionId: user.subscription?.stripeSubscriptionId || null,
              planType: user.subscription?.planType || 'basic',
              status: user.subscription?.status || 'inactive',
              startDate: user.subscription?.startDate || null,
              endDate: user.subscription?.endDate || null
            }
          }
        },
        { new: true, runValidators: true }
      );

      console.log(`   ✅ Updated user: ${updateResult.username}`);
      console.log(`      isVerified: ${updateResult.isVerified}`);
      console.log(`      subscription.planType: ${updateResult.subscription.planType}`);
      console.log(`      subscription.status: ${updateResult.subscription.status}`);
    }

    console.log('\n🎉 Force migration completed successfully!');

    // Verify a specific user that was having issues
    const testUserId = '68caa03277d9ab4fb8c88ac2';
    const testUser = await User.findById(testUserId);
    if (testUser) {
      console.log(`\n🧪 Test user verification:`);
      console.log(`   Username: ${testUser.username}`);
      console.log(`   ID: ${testUser._id}`);
      console.log(`   isVerified: ${testUser.isVerified}`);
      console.log(`   subscription: ${JSON.stringify(testUser.subscription, null, 4)}`);
    }

  } catch (error) {
    console.error('❌ Force migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

forceMigrateUsers();