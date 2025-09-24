<template>
  <div class="h-screen bg-gray-50 overflow-hidden">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Notifications</h1>
        <div class="flex gap-2">
          <button
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-if="notifications.length === 0"
        class="flex flex-col items-center justify-center h-64"
      >
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5-5-5 5h5v-12h0z"
            />
          </svg>
        </div>
        <p class="text-gray-500 text-center">No notifications yet</p>
        <p class="text-gray-400 text-sm text-center mt-1">
          When someone likes or comments on your posts, you'll see them here
        </p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          :class="[
            'flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors',
            !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : '',
          ]"
        >
          <!-- User Avatar -->
          <div class="flex-shrink-0 mr-3">
            <div class="relative">
              <img
                v-if="notification.userProfilePicture"
                :src="notification.userProfilePicture"
                :alt="notification.username"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm"
              >
                {{ notification.username?.charAt(0).toUpperCase() }}
              </div>

              <!-- Notification Type Icon -->
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs',
                  notification.type === 'like' ? 'bg-red-500' : 'bg-blue-500',
                ]"
              >
                <svg
                  v-if="notification.type === 'like'"
                  class="w-3 h-3 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
                <svg v-else class="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Notification Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm text-gray-900">
                  <span class="font-semibold inline-flex items-center">
                    {{ notification.username }}
                    <VerifiedBadge :isVerified="notification.isVerified" size="small" />
                  </span>
                  <span v-if="notification.type === 'like'">
                    liked your post</span
                  >
                  <span v-else-if="notification.type === 'comment'">
                    commented on your post</span
                  >
                  <span v-else-if="notification.type === 'follow'">
                    started following you</span
                  >
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>

              <!-- Post Thumbnail (for post-related notifications) -->
              <div
                v-if="
                  notification.postImage &&
                  (notification.type === 'like' ||
                    notification.type === 'comment')
                "
                class="ml-3 flex-shrink-0"
              >
                <img
                  :src="notification.postImage"
                  alt="Post"
                  class="w-10 h-10 rounded object-cover"
                />
              </div>

              <!-- Unread Indicator -->
              <div
                v-if="!notification.isRead"
                class="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "../stores/notification.js";
import VerifiedBadge from "./VerifiedBadge.vue";

const router = useRouter();
const notificationStore = useNotificationStore();

// Computed properties
const notifications = computed(() => notificationStore.getNotifications);
const unreadCount = computed(() => notificationStore.getUnreadCount);

// Methods
const handleNotificationClick = (notification) => {
  // Mark as read using API
  notificationStore.markAsReadAPI(notification.id);

  // Navigate based on notification type
  if (notification.type === "like" || notification.type === "comment") {
    // Navigate to post (you can implement this later)
    console.log("Navigate to post:", notification.postId);
  } else if (notification.type === "follow") {
    // Navigate to user profile
    router.push(`/profile/${notification.userId}`);
  }
};

const markAllAsRead = () => {
  notificationStore.markAllAsReadAPI();
};

const formatTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInMs = now - notificationTime;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return notificationTime.toLocaleDateString();
  }
};

onMounted(async () => {
  // Fetch notifications from API
  await notificationStore.fetchNotifications();

  // Mark that user has viewed notifications - this will clear the red badge
  console.log("🔔 User visited notifications page - clearing red badge");
  notificationStore.setNotificationsAsViewed();
});
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Notification animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.cursor-pointer {
  animation: slideIn 0.3s ease-out;
}
</style>
