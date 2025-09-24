<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../composables/useStores.js";
import VerifiedBadge from "./VerifiedBadge.vue";

// Get current user from auth store
const { currentUser } = useAuth();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  postData: {
    type: Object,
    default: () => null,
  },
  comments: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "addComment"]);

// Comment input state
const commentText = ref("");
const isSubmitting = ref(false);

// Get current user function
const getCurrentUser = () => {
  if (currentUser.value) {
    return currentUser.value;
  }

  try {
    const userFromStorage = localStorage.getItem("user");
    if (userFromStorage) {
      return JSON.parse(userFromStorage);
    }
  } catch (e) {
    console.log("Error parsing user from localStorage:", e);
  }

  return null;
};

// Submit comment
const submitComment = async () => {
  if (!commentText.value.trim()) return;

  const user = getCurrentUser();
  if (!user) {
    return;
  }

  isSubmitting.value = true;

  try {
    await emit("addComment", commentText.value.trim());
    commentText.value = "";
  } catch (error) {
    console.error("Error submitting comment:", error);
  } finally {
    isSubmitting.value = false;
  }
};

// Close dialog
const closeDialog = () => {
  console.log("🔴 CommentDialog: Closing dialog");
  emit("close");
};

// Handle Enter key
const handleKeyPress = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitComment();
  }
};

// Format time ago like Instagram
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;

  return date.toLocaleDateString();
};
</script>

<template>
  <!-- Full screen overlay -->
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
    @click="closeDialog"
  >
    <!-- Dialog content - Instagram style -->
    <div
      class="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] flex overflow-hidden shadow-2xl"
      style="height: 600px"
      @click.stop
    >
      <!-- Loading or error state -->
      <div v-if="!postData" class="flex items-center justify-center w-full">
        <p class="text-gray-500">Loading post...</p>
      </div>

      <!-- Main content -->
      <template v-else>
        <!-- Left side - Image -->
        <div
          class="hidden md:flex md:w-3/5 bg-black items-center justify-center"
        >
          <img
            v-if="postData?.image"
            :src="postData.image"
            :alt="postData?.caption || 'Post image'"
            class="max-w-full max-h-full object-contain"
          />
          <div v-else class="text-white text-center">
            <svg
              class="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="opacity-50">No image</p>
          </div>
        </div>

        <!-- Right side - Comments -->
        <div class="flex flex-col w-full md:w-2/5 bg-white">
          <!-- Header with user info -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-200"
          >
            <div class="flex items-center space-x-3">
              <img
                :src="
                  postData?.author?.profilePicture ||
                  'https://via.placeholder.com/32'
                "
                :alt="postData?.author?.username || 'User'"
                class="w-8 h-8 rounded-full object-cover"
              />
              <span class="font-semibold text-sm inline-flex items-center">{{
                postData?.author?.username || "Unknown User"
              }}<VerifiedBadge :isVerified="postData?.author?.isVerified" size="small" /></span>
            </div>
            <button
              @click="closeDialog"
              class="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Comments section -->
          <div
            class="flex-1 overflow-y-auto bg-white"
            style="max-height: calc(600px - 80px)"
          >
            <!-- Post caption as first comment -->
            <div class="px-4 py-3 border-b border-gray-100">
              <div class="flex items-start space-x-3">
                <img
                  :src="
                    postData?.author?.profilePicture ||
                    'https://via.placeholder.com/32'
                  "
                  :alt="postData?.author?.username || 'User'"
                  class="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="font-semibold text-sm inline-flex items-center">{{
                      postData?.author?.username || "Unknown User"
                    }}<VerifiedBadge :isVerified="postData?.author?.isVerified" size="small" /></span>
                    <span class="text-xs text-gray-400">
                      {{ formatTimeAgo(postData?.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm leading-relaxed">
                    {{ postData?.caption || "" }}
                  </p>
                  <div
                    class="flex items-center space-x-4 text-xs text-gray-400 mt-2"
                  >
                    <span>{{ formatTimeAgo(postData?.createdAt) }}</span>
                    <span>{{ postData?.likes?.length || 0 }} likes</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comments list -->
            <div class="px-4">
              <div
                v-if="!postData?.comments || postData.comments.length === 0"
                class="text-center text-gray-400 py-12"
              >
                <p class="text-sm">No comments yet.</p>
                <p class="text-xs mt-1">Start the conversation.</p>
              </div>

              <div
                v-for="comment in postData?.comments || []"
                :key="comment._id"
                class="py-3 border-b border-gray-50 last:border-b-0"
              >
                <div class="flex items-start space-x-3">
                  <img
                    :src="
                      comment.author?.profilePicture ||
                      'https://via.placeholder.com/32'
                    "
                    :alt="comment.author?.username"
                    class="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="font-semibold text-sm inline-flex items-center">{{
                        comment.author?.username
                      }}<VerifiedBadge :isVerified="comment.author?.isVerified" size="small" /></span>
                      <span class="text-xs text-gray-400">
                        {{ formatTimeAgo(comment.createdAt) }}
                      </span>
                    </div>
                    <p class="text-sm leading-relaxed">
                      {{ comment.text }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comment input -->
          <div class="px-4 py-3 border-t border-gray-200 bg-white">
            <div class="flex items-center space-x-3">
              <div class="flex-1">
                <input
                  v-model="commentText"
                  @keypress.enter="submitComment"
                  placeholder=""
                  class="w-full border-none outline-none text-sm placeholder-gray-400"
                  :disabled="isSubmitting"
                />
              </div>
              <button
                v-if="commentText.trim()"
                @click="submitComment"
                :disabled="isSubmitting"
                class="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50"
              >
                {{ isSubmitting ? "Posting..." : "Post" }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for comments - Instagram style */
.overflow-y-auto::-webkit-scrollbar {
  width: 3px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c7c7c7;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #8e8e8e;
}

/* Smooth scrolling */
.overflow-y-auto {
  scroll-behavior: smooth;
}

/* Hide scrollbar for Firefox */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #c7c7c7 transparent;
}
</style>
