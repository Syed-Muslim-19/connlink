import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

dotenv.config();

async function manualVerifyUser(userId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return;
    }

    console.log('👤 Current user status:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Plan: ${user.subscription.planType}`);
    console.log(`   Status: ${user.subscription.status}`);

    // Update user to verified premium
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          'subscription.planType': 'premium',
          'subscription.status': 'active',
          'subscription.startDate': new Date(),
          'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      },
      { new: true }
    );

    console.log('\n✅ User verified successfully!');
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Verified: ${updatedUser.isVerified}`);
    console.log(`   Plan: ${updatedUser.subscription.planType}`);
    console.log(`   Status: ${updatedUser.subscription.status}`);
    console.log(`   Valid until: ${updatedUser.subscription.endDate}`);

  } catch (error) {
    console.error('❌ Manual verification failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Get user ID from command line argument or use default
const userId = process.argv[2] || '68caa03277d9ab4fb8c88ac2';
console.log('🔄 Manually verifying user:', userId);

manualVerifyUser(userId);