<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../composables/useStores.js";

// Get current user from auth store
const { currentUser } = useAuth();

const props = defineProps({
  postData: {
    type: Object,
    required: true,
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
  emit("close");
};

// Handle Enter key
const handleKeyPress = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitComment();
  }
};
</script>

<template>
  <!-- Full screen overlay -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="closeDialog"
  >
    <!-- Dialog content -->
    <div
      class="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Comments</h3>
        <button @click="closeDialog" class="text-gray-500 hover:text-gray-700">
          <svg
            class="w-6 h-6"
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

      <!-- Post preview -->
      <div class="p-4 border-b bg-gray-50">
        <div class="flex items-start space-x-3">
          <img
            :src="
              postData.author?.profilePicture ||
              'https://via.placeholder.com/32'
            "
            :alt="postData.author?.username"
            class="w-8 h-8 rounded-full object-cover"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-semibold text-sm">{{
                postData.author?.username
              }}</span>
            </div>
            <p class="text-sm text-gray-700 mt-1">{{ postData.caption }}</p>
          </div>
        </div>
      </div>

      <!-- Comments list -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="comments.length === 0"
          class="text-center text-gray-500 py-8"
        >
          No comments yet. Be the first to comment!
        </div>

        <div
          v-for="comment in comments"
          :key="comment._id"
          class="flex items-start space-x-3"
        >
          <img
            :src="
              comment.author?.profilePicture || 'https://via.placeholder.com/32'
            "
            :alt="comment.author?.username"
            class="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-semibold text-sm">{{
                comment.author?.username
              }}</span>
              <span class="text-xs text-gray-500">
                {{ new Date(comment.createdAt).toLocaleDateString() }}
              </span>
            </div>
            <p class="text-sm text-gray-700 mt-1">{{ comment.text }}</p>
          </div>
        </div>
      </div>

      <!-- Comment input -->
      <div class="p-4 border-t">
        <div class="flex items-center space-x-3">
          <img
            :src="
              getCurrentUser()?.profilePicture ||
              'https://via.placeholder.com/32'
            "
            :alt="getCurrentUser()?.username"
            class="w-8 h-8 rounded-full object-cover"
          />
          <div class="flex-1">
            <textarea
              v-model="commentText"
              @keypress="handleKeyPress"
              placeholder="Add a comment..."
              class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="1"
              :disabled="isSubmitting"
            ></textarea>
          </div>
          <button
            @click="submitComment"
            :disabled="!commentText.trim() || isSubmitting"
            class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? "Posting..." : "Post" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for comments */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
