<template>
  <div class="h-full flex flex-col">
    <!-- Profile Header -->
    <div
      v-if="selectedUser"
      class="flex-shrink-0 flex flex-col items-center py-6 px-4 bg-white border-b border-gray-200"
    >
      <!-- Profile Picture -->
      <div
        v-if="!selectedUser.profilePicture"
        class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3"
      >
        <span class="text-white font-bold text-lg">
          {{ (selectedUser.username || "U").charAt(0).toUpperCase() }}
        </span>
      </div>
      <img
        v-else
        :src="selectedUser.profilePicture"
        :alt="selectedUser.username"
        class="w-16 h-16 rounded-full object-cover mb-3"
      />

      <!-- Username -->
      <h3 class="text-base font-semibold text-gray-900 mb-2">
        {{ selectedUser.username }}
      </h3>

      <!-- View Profile Button -->
      <button
        @click="viewProfile"
        class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        View Profile
      </button>
    </div>

    <!-- Messages Container -->
    <div
      class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      ref="messagesContainer"
    >
      <!-- Sample Messages -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex',
          message.senderId === currentUser._id
            ? 'justify-end'
            : 'justify-start',
        ]"
      >
        <!-- Received Message (Left) -->
        <div
          v-if="message.senderId !== currentUser._id"
          class="flex items-start space-x-2 max-w-xs"
        >
          <!-- Sender Profile Picture -->
          <div
            v-if="!props.selectedUser.profilePicture"
            class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-white font-bold text-xs">
              {{ (props.selectedUser.username || "U").charAt(0).toUpperCase() }}
            </span>
          </div>
          <img
            v-else
            :src="props.selectedUser.profilePicture"
            :alt="props.selectedUser.username"
            class="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />

          <!-- Message Bubble -->
          <div class="bg-gray-100 rounded-2xl px-4 py-2">
            <p class="text-sm text-gray-900">{{ message.message }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatTime(message.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Sent Message (Right) -->
        <div v-else class="flex items-start space-x-2 max-w-xs">
          <!-- Message Bubble -->
          <div class="bg-blue-500 rounded-2xl px-4 py-2">
            <p class="text-sm text-white">{{ message.message }}</p>
            <p class="text-xs text-blue-100 mt-1">
              {{ formatTime(message.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="props.isLoadingMessages"
        class="flex flex-col items-center justify-center py-16"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"
        ></div>
        <p class="text-gray-500 text-sm">Loading messages...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="props.messages.length === 0"
        class="flex flex-col items-center justify-center py-16"
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
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p class="text-gray-500 text-center">
          No messages yet. Start a conversation with
          {{ selectedUser?.username }}!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

// Router and auth
const router = useRouter();
const authStore = useAuthStore();

// Current user
const currentUser = computed(
  () => authStore.currentUser || authStore.user || {}
);

// Props
const props = defineProps({
  selectedUser: {
    type: Object,
    default: null,
  },
  messages: {
    type: Array,
    default: () => [],
  },
  isLoadingMessages: {
    type: Boolean,
    default: false,
  },
});

// Refs
const messagesContainer = ref(null);

// Format timestamp
const formatTime = (timestamp) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return messageTime.toLocaleDateString();
  }
};

// View profile function
const viewProfile = () => {
  if (props.selectedUser?._id) {
    console.log("🟡 Navigating to profile:", props.selectedUser.username);
    router.push(`/profile/${props.selectedUser._id}`);
  }
};

// Scroll to bottom when messages update
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Watch for messages changes to scroll to bottom
watch(
  () => props.messages,
  () => {
    scrollToBottom();
  },
  { deep: true }
);

// Initialize
onMounted(() => {
  console.log(
    "🟡 Messages component mounted for user:",
    props.selectedUser?.username
  );
  scrollToBottom();
});
</script>

<style scoped>
/* Custom scrollbar for messages */
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

/* Message bubble animations */
.bg-gray-100,
.bg-blue-500 {
  transition: all 0.2s ease;
}

.bg-gray-100:hover {
  background-color: #f3f4f6;
}

.bg-blue-500:hover {
  background-color: #3b82f6;
}
</style>
