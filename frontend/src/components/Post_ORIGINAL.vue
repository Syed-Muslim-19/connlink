<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import CommentDialog from "./CommentDialog.vue";
import { useAuth } from "../composables/useStores.js";
import { usePostStore } from "../stores/posts.js";
import { useGetAllPost } from "../composables/useGetAllPost.js";
import { toast } from "vue3-toastify";
import axios from "axios";

// Get current user from auth store
const { currentUser } = useAuth();

// Get post store for deletion
const postStore = usePostStore();

// Get posts refresh function
const { fetchAllPosts } = useGetAllPost();

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

// Define emits
const emit = defineEmits(["postDeleted"]);

// Props to receive post data from parent
const props = defineProps({
  postData: {
    type: Object,
    default: () => ({
      username: "john_doe",
      avatar: "",
      imageUrl:
        "https://images.pexels.com/photos/13397143/pexels-photo-13397143.jpeg",
      likes: 124,
      isLiked: false,
      isBookmarked: false,
    }),
  },
});

// Modal state
const showModal = ref(false);
const showCommentDialog = ref(false);

// Comment input text
const text = ref("");

// Local state for bookmark and comments
const isBookmarked = ref(false);
const commentsCount = ref(0);
const localComments = ref([]);

// Like state - simple and clean
const isLiked = computed(() => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  const likesArray = props.postData.likes || [];
  return likesArray.includes(currentUser._id);
});

// Likes count
const likesCount = computed(() => {
  return props.postData.likes?.length || 0;
});

// Watch for changes in props.postData.comments to sync localComments
watch(
  () => props.postData.comments,
  (newComments) => {
    if (newComments && Array.isArray(newComments)) {
      localComments.value = [...newComments];
      commentsCount.value = newComments.length;
    }
  },
  { immediate: true }
);

// Toggle like function
const toggleLike = async () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    toast.error("Please login to like posts");
    return;
  }

  try {
    const endpoint = isLiked.value ? "dislike" : "like";
    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${endpoint}/${props.postData._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      // Update the post data to trigger reactivity
      props.postData.likes = response.data.post.likes;
      toast.success(response.data.message);

      // Refresh posts to sync with server
      await fetchAllPosts();
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    toast.error(error.response?.data?.message || "Error toggling like");
  }
};

// Toggle bookmark function
const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value;
};

// Show comments function
const showComments = () => {
  showCommentDialog.value = true;
};

// Delete post function
const deletePost = async () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    toast.error("Please login to delete posts");
    return;
  }

  if (props.postData.author._id !== currentUser._id) {
    toast.error("You can only delete your own posts");
    return;
  }

  try {
    const response = await axios.delete(
      `http://localhost:3000/api/v1/post/delete/${props.postData._id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      toast.success("Post deleted successfully");
      emit("postDeleted", props.postData._id);

      // Refresh posts to sync with server
      await fetchAllPosts();
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    toast.error(error.response?.data?.message || "Error deleting post");
  }
};

// Add comment function
const addComment = async (commentText) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    toast.error("Please login to comment");
    return;
  }

  try {
    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${props.postData._id}/comment`,
      { text: commentText },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      // Update local comments
      localComments.value = response.data.post.comments;
      commentsCount.value = response.data.post.comments.length;

      toast.success("Comment added successfully");

      // Refresh posts to sync with server
      await fetchAllPosts();
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    toast.error(error.response?.data?.message || "Error adding comment");
  }
};

// Close modal function
const closeModal = () => {
  showModal.value = false;
};

// Close comment dialog function
const closeCommentDialog = () => {
  showCommentDialog.value = false;
};
</script>

<template>
  <div
    class="max-w-sm mx-auto bg-white border border-gray-300 rounded-lg shadow-md my-4"
  >
    <!-- Post Header -->
    <div class="flex items-center justify-between p-4">
      <div class="flex items-center space-x-3">
        <img
          :src="
            postData.author?.profilePicture || 'https://via.placeholder.com/40'
          "
          :alt="postData.author?.username || 'User'"
          class="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p class="font-semibold text-sm">
            {{ postData.author?.username || "Unknown User" }}
          </p>
          <p class="text-xs text-gray-500">
            {{ new Date(postData.createdAt).toLocaleDateString() }}
          </p>
        </div>
      </div>
      <button
        @click="showModal = true"
        class="text-gray-500 hover:text-gray-700"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
          />
        </svg>
      </button>
    </div>

    <!-- Post Image -->
    <div class="w-full">
      <img
        :src="postData.image || 'https://via.placeholder.com/400'"
        :alt="postData.caption || 'Post'"
        class="w-full h-80 object-cover"
      />
    </div>

    <!-- Post Actions -->
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-4">
          <!-- Like Button -->
          <button
            @click="toggleLike"
            :class="isLiked ? 'text-red-500' : 'text-gray-700'"
            class="hover:text-red-500 transition-colors"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                v-if="isLiked"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Comment Button -->
          <button
            @click="showComments"
            class="text-gray-700 hover:text-gray-900"
          >
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.863 9.863 0 01-4.126-.9L3 20l1.9-5.874A9.863 9.863 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
          </button>

          <!-- Share Button -->
          <button class="text-gray-700 hover:text-gray-900">
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>

        <!-- Bookmark Button -->
        <button
          @click="toggleBookmark"
          :class="isBookmarked ? 'text-gray-900' : 'text-gray-700'"
          class="hover:text-gray-900"
        >
          <svg
            class="w-6 h-6"
            :fill="isBookmarked ? 'currentColor' : 'none'"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      <!-- Likes Count -->
      <div class="mb-2">
        <p class="font-semibold text-sm">{{ likesCount }} likes</p>
      </div>

      <!-- Caption -->
      <div class="mb-2">
        <p class="text-sm">
          <span class="font-semibold">{{
            postData.author?.username || "User"
          }}</span>
          {{ postData.caption || "No caption" }}
        </p>
      </div>

      <!-- Comments Count -->
      <div v-if="commentsCount > 0" class="mb-2">
        <button
          @click="showComments"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          View all {{ commentsCount }} comments
        </button>
      </div>

      <!-- Time Ago -->
      <div class="text-xs text-gray-400">
        {{ new Date(postData.createdAt).toLocaleString() }}
      </div>
    </div>

    <!-- Options Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4" @click.stop>
        <div class="space-y-2">
          <button
            v-if="postData.author?._id === getCurrentUser()?._id"
            @click="deletePost"
            class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
          >
            Delete Post
          </button>
          <button
            @click="closeModal"
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Comment Dialog -->
    <CommentDialog
      v-if="showCommentDialog"
      :post-data="postData"
      :comments="localComments"
      @close="closeCommentDialog"
      @add-comment="addComment"
    />
  </div>
</template>

<style scoped>
/* Add any specific styles here */
</style>
