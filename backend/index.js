import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import notificationRoute from "./routes/notification.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import devRoute from "./routes/dev.route.js";
import { app, server } from "./socket/socket.js";
import { startSubscriptionChecker } from "./services/subscriptionService.js";

dotenv.config({});

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to the API" });
});

// CORS middleware first
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Stripe webhook route BEFORE express.json() middleware
app.use("/api/v1/subscription/webhook", express.raw({ type: 'application/json' }), subscriptionRoute);

// Standard middleware for other routes
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

// Other API routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/notification", notificationRoute);
// Subscription routes (excluding webhook which is handled above)
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/dev", devRoute);

// Add global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Stack:', error.stack);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

server.listen(PORT, () => {
  connectDB();
  startSubscriptionChecker();
  console.log(`Server is running on port ${PORT}`);
});
