import { Notification } from "../models/notification.model.js";

// Helper function to create a notification
export const createNotification = async (notificationData) => {
  try {
    const { recipient, sender, type, post, comment, message } = notificationData;

    // Don't create notification if user is notifying themselves
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    // Check if similar notification already exists (to avoid duplicates)
    const existingNotification = await Notification.findOne({
      recipient,
      sender,
      type,
      post: post || null,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (existingNotification) {
      // Update existing notification instead of creating duplicate
      existingNotification.message = message;
      existingNotification.read = false;
      existingNotification.createdAt = new Date();
      await existingNotification.save();
      return existingNotification;
    }

    // Create new notification
    const notification = new Notification({
      recipient,
      sender,
      type,
      post: post || undefined,
      comment: comment || undefined,
      message,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate({
        path: "sender",
        select: "username profilePicture"
      })
      .populate({
        path: "post",
        select: "image caption"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      totalPages: Math.ceil(await Notification.countDocuments({ recipient: userId }) / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};