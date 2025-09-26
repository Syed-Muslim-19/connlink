import { User } from '../models/user.model.js';

// Development-only endpoint to manually verify users
export const manualVerifyUser = async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not allowed in production', success: false });
    }

    const userId = req.id; // Get from auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

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

    console.log('✅ Manually verified user:', user.username);

    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        isVerified: updatedUser.isVerified,
        subscription: updatedUser.subscription
      }
    });

  } catch (error) {
    console.error('❌ Manual verification error:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

// Simulate webhook completion for testing
export const simulateWebhookCompletion = async (req, res) => {
  try {
    const userId = req.id; // Get from auth middleware

    console.log("🧪 Simulating webhook completion for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    // Simulate the handleCheckoutComplete logic
    const updateData = {
      isVerified: true,
      "subscription.stripeSubscriptionId": `sim_sub_${Date.now()}`,
      "subscription.planType": "premium",
      "subscription.status": "active",
      "subscription.startDate": new Date(),
      "subscription.endDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    console.log("✅ Simulated webhook completion successfully");
    console.log("🔍 User isVerified:", updatedUser.isVerified);

    res.status(200).json({
      success: true,
      message: 'Webhook simulation completed',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        isVerified: updatedUser.isVerified,
        subscription: updatedUser.subscription
      }
    });

  } catch (error) {
    console.error('❌ Webhook simulation error:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

// Clear old Stripe customer data
export const clearStripeData = async (req, res) => {
  try {
    const userId = req.id; // Get from auth middleware

    console.log("🧹 Clearing old Stripe data for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    // Clear all Stripe-related data
    const updateData = {
      isVerified: false,
      "subscription.stripeCustomerId": null,
      "subscription.stripeSubscriptionId": null,
      "subscription.planType": "basic",
      "subscription.status": "inactive",
      "subscription.startDate": null,
      "subscription.endDate": null,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    console.log("✅ Cleared Stripe data successfully");
    console.log("🔍 User isVerified:", updatedUser.isVerified);
    console.log("🔍 Customer ID:", updatedUser.subscription.stripeCustomerId);

    res.status(200).json({
      success: true,
      message: 'Stripe data cleared successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        isVerified: updatedUser.isVerified,
        subscription: updatedUser.subscription
      }
    });

  } catch (error) {
    console.error('❌ Clear Stripe data error:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

// Refresh current user data
export const refreshUserData = async (req, res) => {
  try {
    const userId = req.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        isVerified: user.isVerified,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('❌ Refresh user data error:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};