import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

async function testUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = '68caa03277d9ab4fb8c88ac2'; // Your user ID from the error
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.username);
    console.log('🔍 User verification status:', user.isVerified);
    console.log('🔍 User subscription object:');
    console.log(JSON.stringify(user.subscription, null, 2));
    console.log('🔍 User subscription type:', typeof user.subscription);
    console.log('🔍 User subscription planType:', user.subscription?.planType);

    // Test that we can access all required fields
    const requiredFields = ['stripeCustomerId', 'stripeSubscriptionId', 'planType', 'status', 'startDate', 'endDate'];
    requiredFields.forEach(field => {
      console.log(`🔍 ${field}:`, user.subscription[field]);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testUser();