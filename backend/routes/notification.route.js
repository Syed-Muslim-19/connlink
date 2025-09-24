import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} from "../controllers/notification.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getNotifications);
router.route("/unread-count").get(isAuthenticated, getUnreadCount);
router.route("/mark-all-read").post(isAuthenticated, markAllAsRead);
router.route("/:notificationId/read").post(isAuthenticated, markAsRead);
router.route("/:notificationId").delete(isAuthenticated, deleteNotification);

export default router;