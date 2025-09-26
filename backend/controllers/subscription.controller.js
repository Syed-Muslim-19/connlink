import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { syncSubscriptionWithStripe } from "../services/subscriptionService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createSubscription = async (req, res) => {
  try {
    console.log("🔄 Creating subscription for user:", req.id);
    console.log("🔍 Request body:", req.body);
    console.log("🔍 Request body type:", typeof req.body);

    const userId = req.id;
    const planType =
      req.body && req.body.planType ? req.body.planType : "premium";

    console.log("🔍 Plan type:", planType);

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    console.log("✅ User found:", user.username);
    console.log("🔍 User ID:", user._id);
    console.log("🔍 User subscription exists:", !!user.subscription);
    console.log("🔍 User subscription:", user.subscription);
    console.log("🔍 User subscription type:", typeof user.subscription);

    // Failsafe: Initialize subscription if it doesn't exist
    if (!user.subscription) {
      console.log("⚠️  Subscription object missing, initializing...");
      user.subscription = {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planType: "basic",
        status: "inactive",
        startDate: null,
        endDate: null,
      };
      await user.save();
      console.log("✅ Initialized subscription object");
    }

    let customerId = user.subscription.stripeCustomerId;
    console.log("🔍 Existing customer ID:", customerId);

    if (!customerId) {
      console.log("🔄 Creating new Stripe customer...");
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      console.log("✅ Created Stripe customer:", customerId);

      user.subscription.stripeCustomerId = customerId;
      await user.save();
      console.log("✅ Saved customer ID to user");
    }

    const prices = {
      premium: process.env.STRIPE_PRICE_ID || "price_1SAoUWFX9N9PWpF2LoremIps",
    };

    console.log("🔍 Using price ID:", prices[planType]);
    console.log("🔍 Plan type:", planType);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: prices[planType],
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
        planType,
      },
    });

    console.log("✅ Created Stripe checkout session:", session.id);

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("❌ Subscription creation error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Full error:", error);

    // Send more specific error messages
    let errorMessage = "Internal server error";
    if (error.message.includes("No such price")) {
      errorMessage = "Invalid price configuration. Please check Stripe setup.";
    } else if (error.message.includes("No such customer")) {
      errorMessage = "Customer creation failed. Please try again.";
    } else if (error.message.includes("API key")) {
      errorMessage = "Stripe configuration error. Please contact support.";
    }

    res.status(500).json({
      message: errorMessage,
      success: false,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Webhook signature verified successfully");
    console.log("🔍 Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    console.error("🔍 Endpoint Secret:", endpointSecret ? "Set" : "Missing");
    console.error("🔍 Signature Header:", sig ? "Present" : "Missing");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        try {
          await handleCheckoutComplete(session);
          console.log("✅ Successfully processed checkout.session.completed");
        } catch (sessionError) {
          console.error("❌ Error processing checkout.session.completed:", sessionError);
          // Don't fail the webhook - just log the error
        }
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        try {
          await handleSubscriptionChange(subscription);
          console.log(`✅ Successfully processed ${event.type}`);
        } catch (subError) {
          console.error(`❌ Error processing ${event.type}:`, subError);
        }
        break;

      case "invoice.payment_failed":
        const invoice = event.data.object;
        try {
          await handlePaymentFailed(invoice);
          console.log("✅ Successfully processed invoice.payment_failed");
        } catch (invoiceError) {
          console.error("❌ Error processing invoice.payment_failed:", invoiceError);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const handleCheckoutComplete = async (session) => {
  console.log("🎉 Processing checkout completion for session:", session.id);

  const userId = session.metadata.userId;
  const planType = session.metadata.planType;

  console.log("🔍 User ID from metadata:", userId);
  console.log("🔍 Plan type from metadata:", planType);

  if (!userId) {
    console.error("❌ No userId found in session metadata");
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    console.log("✅ Retrieved Stripe subscription:", subscription.id);
    console.log("🔍 Subscription status:", subscription.status);

    const updateData = {
      isVerified: true,
      "subscription.stripeSubscriptionId": subscription.id,
      "subscription.planType": planType,
      "subscription.status": "active",
      "subscription.startDate": new Date(subscription.start_date * 1000),
      "subscription.endDate": new Date(subscription.current_period_end * 1000),
    };

    console.log("🔄 Updating user with data:", updateData);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (updatedUser) {
      console.log("✅ User updated successfully:");
      console.log("🔍 isVerified:", updatedUser.isVerified);
      console.log("🔍 subscription status:", updatedUser.subscription.status);
    } else {
      console.error("❌ Failed to find/update user:", userId);
    }
  } catch (error) {
    console.error("❌ Error in handleCheckoutComplete:", error);
    throw error;
  }
};

const handleSubscriptionChange = async (subscription) => {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;

  if (!userId) return;

  const updateData = {
    "subscription.status": subscription.status,
    "subscription.endDate": new Date(subscription.current_period_end * 1000),
  };

  if (subscription.status === "active") {
    updateData.isVerified = true;
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired"
  ) {
    updateData.isVerified = false;
  }

  await User.findByIdAndUpdate(userId, updateData);
};

const handlePaymentFailed = async (invoice) => {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const userId = customer.metadata.userId;

  if (!userId) return;

  await User.findByIdAndUpdate(userId, {
    "subscription.status": "past_due",
  });
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId).select("isVerified subscription");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    res.status(200).json({
      success: true,
      subscription: user.subscription,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user || !user.subscription.stripeSubscriptionId) {
      return res
        .status(404)
        .json({ message: "Subscription not found", success: false });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    res.status(200).json({
      success: true,
      message: "Subscription will be canceled at the end of the current period",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const verifyPaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.id;

    console.log("🔍 Verifying payment success for session:", session_id);
    console.log("🔍 User ID:", userId);

    if (!session_id) {
      return res.status(400).json({
        message: "Session ID is required",
        success: false
      });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log("✅ Retrieved checkout session:", session.id);
    console.log("🔍 Session status:", session.status);
    console.log("🔍 Payment status:", session.payment_status);

    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Get the subscription from the session
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        console.log("✅ Retrieved subscription:", subscription.id);
        console.log("🔍 Subscription status:", subscription.status);

        // Update user verification status
        const updateData = {
          isVerified: true,
          "subscription.stripeSubscriptionId": subscription.id,
          "subscription.planType": "premium",
          "subscription.status": "active",
          "subscription.startDate": new Date(subscription.start_date * 1000),
          "subscription.endDate": new Date(subscription.current_period_end * 1000),
        };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        console.log("✅ User verified successfully via payment verification");
        console.log("🔍 User isVerified:", updatedUser.isVerified);

        return res.status(200).json({
          success: true,
          message: "Payment verified and user upgraded successfully",
          isVerified: true,
          subscription: updatedUser.subscription
        });
      }
    }

    res.status(200).json({
      success: false,
      message: "Payment not completed or session invalid",
      isVerified: false
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      success: false
    });
  }
};

export const syncSubscription = async (req, res) => {
  try {
    const userId = req.id;

    const subscription = await syncSubscriptionWithStripe(userId);

    if (!subscription) {
      return res.status(404).json({
        message: "No subscription found to sync",
        success: false,
      });
    }

    const user = await User.findById(userId).select("isVerified subscription");

    res.status(200).json({
      success: true,
      message: "Subscription synced successfully",
      subscription: user.subscription,
      isVerified: user.isVerified,
      stripeStatus: subscription.status,
    });
  } catch (error) {
    console.error("Sync subscription error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};
