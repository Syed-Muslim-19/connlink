import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

export const useNotificationStore = defineStore("notification", () => {
  // State
  const notifications = ref([]);
  const unreadCount = ref(0);
  const hasNewNotifications = ref(false);

  // Getters
  const getNotifications = computed(() => notifications.value);
  const getUnreadCount = computed(() => unreadCount.value);
  const hasUnreadNotifications = computed(() => hasNewNotifications.value);

  // Actions
  const addNotification = (notification) => {
    console.log("🔔 FRONTEND: Adding notification:", notification);

    // Transform backend data format to frontend format
    const transformedNotification = {
      ...notification,
      id: Date.now() + Math.random(), // Ensure unique ID
      timestamp: new Date().toISOString(),
      isRead: false,
      // Handle userDetails from backend
      username: notification.userDetails?.username || notification.username,
      userProfilePicture:
        notification.userDetails?.profilePicture ||
        notification.userProfilePicture,
      // Add postImage if available (you can get this from the post data later)
      postImage: notification.postImage || null,
    };

    console.log(
      "🔔 FRONTEND: Transformed notification:",
      transformedNotification
    );

    // Check if it's a like notification
    if (notification.type === "like") {
      // Remove any existing like notification from the same user for the same post
      notifications.value = notifications.value.filter(
        (n) =>
          !(
            n.type === "like" &&
            n.userId === notification.userId &&
            n.postId === notification.postId
          )
      );

      // Add the new like notification
      notifications.value.unshift(transformedNotification);
    } else {
      // For other notification types, just add them
      notifications.value.unshift(transformedNotification);
    }

    // Update unread count and new notification flag
    updateUnreadCount();
    hasNewNotifications.value = true;

    console.log("🔔 Notifications updated:", notifications.value.length);
  };

  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.isRead = true;
      updateUnreadCount();
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.isRead = true));
    unreadCount.value = 0;
    hasNewNotifications.value = false;
  };

  const removeNotification = (notificationId) => {
    notifications.value = notifications.value.filter(
      (n) => n.id !== notificationId
    );
    updateUnreadCount();
  };

  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter((n) => !n.isRead).length;
  };

  const clearNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
    hasNewNotifications.value = false;
  };

  const setNotificationsAsViewed = () => {
    hasNewNotifications.value = false;
  };

  // API functions
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/v1/notification", {
        withCredentials: true,
      });

      if (response.data.success) {
        // Transform backend notifications to frontend format
        const backendNotifications = response.data.notifications.map(notification => ({
          id: notification._id,
          type: notification.type,
          message: notification.message,
          timestamp: notification.createdAt,
          isRead: notification.read,
          userId: notification.sender?._id,
          username: notification.sender?.username,
          userProfilePicture: notification.sender?.profilePicture,
          postId: notification.post?._id,
          postImage: notification.post?.image,
        }));

        // Replace existing notifications with fetched ones
        notifications.value = backendNotifications;
        unreadCount.value = response.data.unreadCount;
        hasNewNotifications.value = response.data.unreadCount > 0;

        console.log("🔔 Fetched notifications from API:", backendNotifications.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsReadAPI = async (notificationId) => {
    try {
      // Update UI immediately (optimistic update)
      markAsRead(notificationId);

      // Send request to backend
      await axios.post(`/api/v1/notification/${notificationId}/read`, {}, {
        withCredentials: true,
      });

      console.log("🔔 Marked notification as read:", notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Could revert optimistic update here if needed
    }
  };

  const markAllAsReadAPI = async () => {
    try {
      // Update UI immediately (optimistic update)
      markAllAsRead();

      // Send request to backend
      await axios.post("/api/v1/notification/mark-all-read", {}, {
        withCredentials: true,
      });

      console.log("🔔 Marked all notifications as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Could revert optimistic update here if needed
    }
  };

  const getUnreadCountAPI = async () => {
    try {
      const response = await axios.get("/api/v1/notification/unread-count", {
        withCredentials: true,
      });

      if (response.data.success) {
        unreadCount.value = response.data.unreadCount;
        hasNewNotifications.value = response.data.unreadCount > 0;
      }
    } catch (error) {
      console.error("Failed to get unread count:", error);
    }
  };

  const deleteNotificationAPI = async (notificationId) => {
    try {
      // Update UI immediately (optimistic update)
      removeNotification(notificationId);

      // Send request to backend
      await axios.delete(`/api/v1/notification/${notificationId}`, {
        withCredentials: true,
      });

      console.log("🔔 Deleted notification:", notificationId);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      // Could revert optimistic update here if needed
    }
  };

  // Initialize notification store - call this when app starts
  const initializeNotifications = async () => {
    try {
      await getUnreadCountAPI();
      console.log("🔔 Notification store initialized");
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
    }
  };

  return {
    // State
    notifications,
    unreadCount,
    hasNewNotifications,

    // Getters
    getNotifications,
    getUnreadCount,
    hasUnreadNotifications,

    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    setNotificationsAsViewed,

    // API functions
    fetchNotifications,
    markAsReadAPI,
    markAllAsReadAPI,
    getUnreadCountAPI,
    deleteNotificationAPI,
    initializeNotifications,
  };
});
