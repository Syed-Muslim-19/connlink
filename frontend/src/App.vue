<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import { useAuth } from "./composables/useStores.js";
import { useSocketStore } from "./stores/socket.js";
import { useChatStore } from "./stores/chat.js";
import { useAuthStore } from "./stores/auth.js";
import { useNotificationStore } from "./stores/notification.js";

const { initializeAuth } = useAuth();
const socketStore = useSocketStore();
const chatStore = useChatStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Make notification store available globally for debugging
window.debugNotificationStore = notificationStore;

// Generate unique tab ID for this session
const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Socket connection function
const connectSocket = (userId) => {
  if (socketStore.socket) {
    console.log("🟡 Socket already connected for tab:", tabId);
    return;
  }

  console.log("🟡 Connecting socket for user:", userId, "in tab:", tabId);

  const socketInstance = io("http://localhost:3000", {
    query: {
      userId: userId,
      tabId: tabId,
    },
    transports: ["websocket"],
  });

  // Store socket instance
  socketStore.setSocket(socketInstance);

  // Socket event listeners
  socketInstance.on("connect", () => {
    console.log("🟢 Socket connected for tab:", tabId);
  });

  socketInstance.on("getOnlineUsers", (users) => {
    console.log("🟡 Online users updated:", users.length);
    chatStore.setOnlineUsers(users);
  });

  // Real-time notification listener
  socketInstance.on("newNotification", (notificationData) => {
    console.log(
      "🔔 FRONTEND: New notification received via socket:",
      notificationData
    );
    console.log("🔔 FRONTEND: Current socket ID:", socketInstance.id);

    // Transform backend notification to frontend format
    const transformedNotification = {
      id: notificationData._id,
      type: notificationData.type,
      message: notificationData.message,
      timestamp: notificationData.createdAt,
      isRead: notificationData.read,
      userId: notificationData.sender?._id,
      username: notificationData.sender?.username,
      userProfilePicture: notificationData.sender?.profilePicture,
      postId: notificationData.post?._id,
      postImage: notificationData.post?.image,
    };

    // Add to notification store
    notificationStore.addNotification(transformedNotification);
  });

  // Real-time like updates listener
  socketInstance.on("postLikeUpdate", (likeUpdateData) => {
    console.log(
      "👍 FRONTEND: Like update received via socket:",
      likeUpdateData
    );

    // Emit a custom event to update posts components
    window.dispatchEvent(
      new CustomEvent("postLikeUpdate", {
        detail: likeUpdateData,
      })
    );
  });

  socketInstance.on("disconnect", () => {
    console.log("🔴 Socket disconnected for tab:", tabId);
  });

  socketInstance.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error);
  });
};

// Disconnect socket function
const disconnectSocket = () => {
  if (socketStore.socket) {
    console.log("🟡 Disconnecting socket for tab:", tabId);
    socketStore.socket.close();
    socketStore.setSocket(null);
    chatStore.clearChat();
    notificationStore.clearNotifications();
  }
};

// Watch for user authentication changes
watch(
  () => authStore.currentUser || authStore.user,
  (newUser, oldUser) => {
    console.log("🟡 User auth changed:", {
      old: oldUser?.username,
      new: newUser?.username,
    });

    if (newUser?._id) {
      // User is authenticated, connect socket and initialize notifications
      connectSocket(newUser._id);
      notificationStore.initializeNotifications();
    } else {
      // User is not authenticated, disconnect socket
      disconnectSocket();
    }
  },
  { immediate: true }
);

onMounted(() => {
  initializeAuth();

  // If user is already authenticated, connect socket and initialize notifications
  const currentUser = authStore.currentUser || authStore.user;
  if (currentUser?._id) {
    connectSocket(currentUser._id);
    notificationStore.initializeNotifications();
  }
});

onUnmounted(() => {
  disconnectSocket();
});
</script>

<template>
  <router-view />
</template>

<style scoped></style>
