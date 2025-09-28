<template>
  <div class="pt-4 space-y-6 px-4 sm:px-6 lg:px-0">
    <!-- Comment Dialog -->
    <CommentDialog
      :show="showCommentDialog"
      :postData="selectedPost"
      @close="showCommentDialog = false"
      @commentAdded="onCommentAdded"
    />

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="text-gray-500 mt-2">Loading posts...</p>
    </div>

    <!-- No Posts -->
    <div v-else-if="!loading && posts.length === 0" class="text-center py-8">
      <Camera class="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p class="text-gray-500">No posts available. Create your first post!</p>
      <button
        @click="fetchPosts"
        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry Loading Posts
      </button>
    </div>

    <!-- Real Posts from Database -->
    <div
      v-else
      v-for="post in posts"
      :key="post._id"
      :data-post-id="post._id"
      class="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-md mx-auto"
    >
      <!-- Post Header -->
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 bg-gray-300 rounded-full overflow-hidden cursor-pointer"
            @click="goToProfile(post.author?._id)"
          >
            <img
              v-if="post.author?.profilePicture"
              :src="post.author.profilePicture"
              :alt="post.author.username"
              class="w-full h-full object-cover"
            />
            <User v-else class="w-full h-full p-1 text-gray-400" />
          </div>
          <div class="cursor-pointer" @click="goToProfile(post.author?._id)">
            <p class="font-semibold text-sm flex items-center">
              {{ post.author?.username || "Unknown User" }}
              <VerifiedBadge
                :isVerified="post.author?.isVerified"
                size="small"
              />
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDate(post.createdAt) }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Delete button for post owner -->
          <button
            v-if="authStore.user && post.author?._id === authStore.user._id"
            @click="deletePost(post._id)"
            :disabled="deletingPosts.includes(post._id)"
            class="text-red-500 hover:text-red-700 transition-colors p-1"
            title="Delete post"
          >
            <Trash2 v-if="!deletingPosts.includes(post._id)" class="w-4 h-4" />
            <div
              v-else
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"
            ></div>
          </button>
          <div class="relative">
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="toggleMenu(post._id)"
            >
              <MoreHorizontal class="w-5 h-5" />
            </button>
            <div
              v-if="openMenuId === post._id"
              class="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50"
              @click.stop
            >
              <template
                v-if="authStore.user && post.author?._id === authStore.user._id"
              >
                <button
                  @click="confirmDelete(post._id)"
                  class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
                <button
                  @click="closeMenu"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </template>
              <template v-else>
                <button
                  @click="followUser(post.author?._id)"
                  class="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                >
                  Follow
                </button>
                <button
                  @click="closeMenu"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Image -->
      <div class="bg-gray-200 h-96 overflow-hidden">
        <img
          v-if="post.image"
          :src="post.image"
          :alt="post.caption"
          class="w-full h-full object-cover"
        />
        <div v-else class="flex items-center justify-center h-full">
          <ImageIcon class="w-12 h-12 text-gray-400" />
        </div>
      </div>

      <!-- Post Actions -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-4">
            <button
              @click="likePost(post._id)"
              :class="[
                'transition-colors p-1',
                isLiked(post) ? 'text-red-500' : 'hover:text-red-500',
              ]"
              :disabled="likingPosts.includes(post._id)"
            >
              <Heart v-if="isLiked(post)" class="w-6 h-6 fill-current" />
              <Heart v-else class="w-6 h-6" />
            </button>
            <button
              @click="openComments(post)"
              class="hover:text-blue-500 transition-colors p-1"
            >
              <MessageCircle class="w-6 h-6" />
            </button>
          </div>
          <button
            @click="bookmarkPost(post._id)"
            :class="[
              'transition-colors p-1',
              isBookmarked(post) ? 'text-yellow-600' : 'hover:text-yellow-600',
            ]"
            :disabled="bookmarkingPosts.includes(post._id)"
          >
            <Bookmark v-if="isBookmarked(post)" class="w-6 h-6 fill-current" />
            <Bookmark v-else class="w-6 h-6" />
          </button>
        </div>

        <!-- Likes Count -->
        <p class="text-sm font-semibold mb-2">
          <span class="likes-count">{{ post.likes?.length || 0 }}</span>
          {{ (post.likes?.length || 0) === 1 ? "like" : "likes" }}
        </p>

        <!-- Caption -->
        <div class="text-sm mb-2" v-if="post.caption">
          <span class="font-semibold inline-flex items-center">
            {{ post.author?.username }}
            <VerifiedBadge :isVerified="post.author?.isVerified" size="small" />
          </span>
          <span class="ml-1">{{ post.caption }}</span>
        </div>

        <!-- Comments Preview -->
        <button
          v-if="post.comments?.length > 0"
          @click="openComments(post)"
          class="text-xs text-gray-500 hover:text-gray-700 mb-2 block"
        >
          View all {{ post.comments.length }}
          {{ post.comments.length === 1 ? "comment" : "comments" }}
        </button>

        <!-- Always show "Add comment" button for testing -->
        <button
          v-if="!post.comments?.length || post.comments.length === 0"
          @click="openComments(post)"
          class="text-xs text-gray-500 hover:text-gray-700 mb-2 block"
        >
          Add a comment...
        </button>

        <!-- Quick Comment Input -->
        <form
          @submit.prevent="addQuickComment(post._id)"
          class="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100"
        >
          <div
            class="w-6 h-6 bg-gray-300 rounded-full overflow-hidden flex-shrink-0"
          >
            <img
              v-if="authStore.user?.profilePicture"
              :src="authStore.user.profilePicture"
              :alt="authStore.user.username"
              class="w-full h-full object-cover"
            />
            <User v-else class="w-full h-full p-1 text-gray-400" />
          </div>
          <input
            v-model="quickComments[post._id]"
            type="text"
            placeholder="Add a comment..."
            class="flex-1 text-sm focus:outline-none"
          />
          <button
            type="submit"
            :disabled="
              !quickComments[post._id]?.trim() || addingQuickComment[post._id]
            "
            class="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {{ addingQuickComment[post._id] ? "Posting..." : "Post" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useSocketStore } from "../stores/socket.js";
const router = useRouter();

function goToProfile(userId) {
  if (userId) {
    router.push({ name: "Profile", params: { id: userId } });
  }
}
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import {
  Heart,
  MessageCircle,
  Bookmark,
  User,
  Camera,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
} from "lucide-vue-next";
import CommentDialog from "./CommentDialog.vue";
import VerifiedBadge from "./VerifiedBadge.vue";
import { toast } from "vue3-toastify";

const authStore = useAuthStore();
const socketStore = useSocketStore();
// Use toast directly from vue3-toastify

// State for three dots menu
const openMenuId = ref(null);

function toggleMenu(postId) {
  openMenuId.value = openMenuId.value === postId ? null : postId;
}

function closeMenu() {
  openMenuId.value = null;
}

function confirmDelete(postId) {
  closeMenu();
  deletePost(postId);
}

async function followUser(userId) {
  try {
    closeMenu();
    const token = sessionStorage.getItem("token");
    const response = await axios.post(
      `http://localhost:3000/api/v1/user/followorunfollow/${userId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }
  } catch (error) {
    console.error("Error following user:", error);
    toast.error("Failed to follow user");
  }
}

const posts = ref([]);
const loading = ref(true);
const likingPosts = ref([]);
const bookmarkingPosts = ref([]);
const deletingPosts = ref([]);
const showCommentDialog = ref(false);
const selectedPost = ref(null);
const quickComments = reactive({});
const addingQuickComment = reactive({});

const fetchPosts = async () => {
  try {
    console.log("🟡 Posts: Starting fetchPosts...");
    loading.value = true;

    console.log("🟡 Posts: Making API call to fetch posts...");
    const response = await axios.get("http://localhost:3000/api/v1/post/all", {
      withCredentials: true,
    });

    console.log("🟡 Posts: API response:", response.data);

    if (response.data.success) {
      posts.value = response.data.posts;
      console.log("🟢 Posts: Posts loaded successfully:", posts.value.length);
    } else {
      console.log(
        "🔴 Posts: API returned success=false:",
        response.data.message
      );
    }
  } catch (error) {
    console.error("🔴 Posts: Error fetching posts:", error);
    console.error("🔴 Posts: Error response:", error.response?.data);

    if (error.response?.status === 401) {
      console.log("🔴 Posts: Unauthorized, redirecting to login...");
      authStore.setAuthUser(null);
      window.location.href = "/login";
    }
  } finally {
    loading.value = false;
    console.log("🟡 Posts: fetchPosts completed, loading:", loading.value);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`;
  return date.toLocaleDateString();
};

const isLiked = (post) => {
  if (!authStore.user || !post.likes) return false;
  const liked = post.likes.some(
    (like) => (like._id || like) === authStore.user._id
  );
  return liked;
};

const isBookmarked = (post) => {
  return (
    authStore.user &&
    authStore.user.bookmarks &&
    authStore.user.bookmarks.includes(post._id)
  );
};

const likePost = async (postId) => {
  try {
    likingPosts.value.push(postId);

    // Get current post to check if it's already liked
    const postIndex = posts.value.findIndex((p) => p._id === postId);
    if (postIndex === -1) return;

    const post = posts.value[postIndex];
    const isCurrentlyLiked = post.likes.some(
      (like) => (like._id || like) === authStore.user._id
    );

    // Call the appropriate endpoint
    const endpoint = isCurrentlyLiked ? "dislike" : "like";
    const token = sessionStorage.getItem("token");

    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${postId}/${endpoint}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      // Update the post with the response data
      const responseData = response.data;

      // Update like status for current user only
      if (responseData.isLiked) {
        // Add user ID to likes array if not already present
        if (
          !post.likes.some((like) => (like._id || like) === authStore.user._id)
        ) {
          post.likes.push(authStore.user._id);
        }
        toast.success("Post liked!");
      } else {
        // Remove user ID from likes array
        post.likes = post.likes.filter(
          (like) => (like._id || like) !== authStore.user._id
        );
        toast.success("Post unliked!");
      }

      // Update the visual like count for current user immediately
      // Socket listeners will handle updates for other users
      const likeElements = document.querySelectorAll(
        `[data-post-id="${postId}"] .likes-count`
      );
      likeElements.forEach((el) => {
        if (el) el.textContent = responseData.likesCount;
      });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    toast.error("Failed to like post");
  } finally {
    likingPosts.value = likingPosts.value.filter((id) => id !== postId);
  }
};

const bookmarkPost = async (postId) => {
  try {
    bookmarkingPosts.value.push(postId);
    const response = await axios.get(
      `http://localhost:3000/api/v1/post/${postId}/bookmark`,
      { withCredentials: true }
    );

    if (response.data.success) {
      // Update user bookmarks in store INSTANTLY
      const updatedUser = { ...authStore.user };
      if (response.data.type === "saved") {
        updatedUser.bookmarks = [...(updatedUser.bookmarks || []), postId];
      } else {
        updatedUser.bookmarks = (updatedUser.bookmarks || []).filter(
          (id) => id !== postId
        );
      }
      authStore.setAuthUser(updatedUser);
    }
  } catch (error) {
    console.error("Error bookmarking post:", error);
    toast.error("Failed to bookmark post");
  } finally {
    bookmarkingPosts.value = bookmarkingPosts.value.filter(
      (id) => id !== postId
    );
  }
};

const deletePost = async (postId) => {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    deletingPosts.value.push(postId);
    const response = await axios.delete(
      `http://localhost:3000/api/v1/post/delete/${postId}`,
      { withCredentials: true }
    );

    if (response.data.success) {
      toast.success("Post deleted successfully!");
      // Remove post from local array immediately
      posts.value = posts.value.filter((post) => post._id !== postId);

      // Refresh after 1-2 seconds
      setTimeout(() => {
        fetchPosts();
      }, 1500);
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    toast.error("Failed to delete post");
  } finally {
    deletingPosts.value = deletingPosts.value.filter((id) => id !== postId);
  }
};

const openComments = (post) => {
  console.log("🟡 Posts: Opening comments for post:", post);
  selectedPost.value = post;
  showCommentDialog.value = true;
  console.log("🟡 Posts: showCommentDialog set to:", showCommentDialog.value);
  console.log("🟡 Posts: selectedPost set to:", selectedPost.value);
};

const testOpenDialog = () => {
  console.log("🧪 Test: Opening dialog with dummy data");
  selectedPost.value = {
    _id: "test-id",
    author: { username: "testuser", profilePicture: null },
    image: "https://via.placeholder.com/400",
    caption: "This is a test post to check if the dialog opens properly.",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [
      {
        _id: "comment-1",
        text: "This is a test comment!",
        author: { username: "commenter", profilePicture: null },
        createdAt: new Date().toISOString(),
      },
    ],
  };
  showCommentDialog.value = true;
  console.log("🧪 Test: Dialog should be open now");
};

const addQuickComment = async (postId) => {
  const commentText = quickComments[postId]?.trim();
  if (!commentText) return;

  try {
    addingQuickComment[postId] = true;
    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${postId}/comment`,
      { text: commentText },
      { withCredentials: true }
    );

    if (response.data.success) {
      // Update post comments count instantly
      const postIndex = posts.value.findIndex((p) => p._id === postId);
      if (postIndex !== -1) {
        if (!posts.value[postIndex].comments) {
          posts.value[postIndex].comments = [];
        }
        posts.value[postIndex].comments.push(response.data.comment);
      }

      // Clear the input
      quickComments[postId] = "";
      toast.success("Comment added!");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    toast.error("Failed to add comment");
  } finally {
    addingQuickComment[postId] = false;
  }
};

const onCommentAdded = (comment) => {
  // Update the selected post's comments if it's still open
  if (selectedPost.value) {
    if (!selectedPost.value.comments) {
      selectedPost.value.comments = [];
    }
    selectedPost.value.comments.push(comment);

    // Also update in the main posts array
    const postIndex = posts.value.findIndex(
      (p) => p._id === selectedPost.value._id
    );
    if (postIndex !== -1) {
      if (!posts.value[postIndex].comments) {
        posts.value[postIndex].comments = [];
      }
      posts.value[postIndex].comments.push(comment);
    }
  }
};

onMounted(() => {
  console.log("🟡 Posts: Component mounted");
  console.log("🟡 Posts: Auth store user:", authStore.user);
  console.log("🟡 Posts: Is authenticated:", authStore.isAuthenticated);

  // Initialize auth first
  authStore.initializeAuth();

  console.log("🟡 Posts: After init - Auth store user:", authStore.user);
  console.log(
    "🟡 Posts: After init - Is authenticated:",
    authStore.isAuthenticated
  );

  if (authStore.user) {
    console.log("🟢 Posts: User found, fetching posts...");
    fetchPosts();
  } else {
    console.log("🔴 Posts: No user found, not fetching posts");
    loading.value = false;
  }

  // Setup socket listeners for real-time like updates
  const socket = socketStore.getSocket();
  if (socket) {
    // Listen for like updates from other users
    const handleLikeUpdate = (data) => {
      // Don't update if this is from the current user (they already have it updated)
      if (data.excludeUserId && data.excludeUserId === authStore.user?._id) {
        return;
      }

      // Update the like count for this post for other users
      const postIndex = posts.value.findIndex((p) => p._id === data.postId);
      if (postIndex !== -1) {
        // Update the visual like count only - don't change the user's like state
        const likeElements = document.querySelectorAll(
          `[data-post-id="${data.postId}"] .likes-count`
        );
        likeElements.forEach((el) => {
          if (el) el.textContent = data.likesCount;
        });

        toast.info(
          `Post ${data.action === "like" ? "liked" : "unliked"} by another user`
        );
      }
    };

    socket.on("postLikeUpdate", handleLikeUpdate);

    // Store the cleanup function for later
    const socketCleanup = () => {
      socket.off("postLikeUpdate", handleLikeUpdate);
    };
  }

  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (openMenuId.value) {
      closeMenu();
    }
  };

  document.addEventListener("click", handleClickOutside);

  // Cleanup listeners on unmount
  const cleanup = () => {
    document.removeEventListener("click", handleClickOutside);

    // Cleanup socket listeners
    const socket = socketStore.getSocket();
    if (socket) {
      socket.off("postLikeUpdate");
    }
  };

  // Return cleanup function for onUnmounted
  return cleanup;
});
</script>
