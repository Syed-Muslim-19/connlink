import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

// Load environment variables
dotenv.config();

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all users without subscription object or with incomplete subscription
    const usersToUpdate = await User.find({
      $or: [
        { subscription: { $exists: false } },
        { "subscription.stripeCustomerId": { $exists: false } },
        { isVerified: { $exists: false } },
      ],
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log("🎉 All users already have the correct schema!");
      return;
    }

    // Update each user
    const updatePromises = usersToUpdate.map((user) => {
      const updateData = {
        isVerified: user.isVerified || false,
        subscription: {
          stripeCustomerId: user.subscription?.stripeCustomerId || null,
          stripeSubscriptionId: user.subscription?.stripeSubscriptionId || null,
          planType: user.subscription?.planType || "basic",
          status: user.subscription?.status || "inactive",
          startDate: user.subscription?.startDate || null,
          endDate: user.subscription?.endDate || null,
        },
      };

      return User.findByIdAndUpdate(user._id, updateData, { new: true });
    });

    const updatedUsers = await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${updatedUsers.length} users`);

    // Show sample of updated users
    console.log("\n📋 Sample updated users:");
    updatedUsers.slice(0, 3).forEach((user) => {
      console.log(
        `- ${user.username}: verified=${user.isVerified}, plan=${user.subscription.planType}`
      );
    });

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

migrateUsers();
