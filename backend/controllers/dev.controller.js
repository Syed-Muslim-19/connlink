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