<template>
  <div class="pt-4 px-4 sm:px-6 lg:px-0 space-y-6">
    <!-- Comment Dialog -->
    <CommentDialog
      :show="showCommentDialog"
      :postData="selectedPost"
      @close="showCommentDialog = false"
      @commentAdded="onCommentAdded"
    />

    <!-- Empty State for Home Feed -->
    <div v-if="!loading && posts.length === 0" class="text-center py-12">
      <div class="mb-6">
        <svg
          class="w-16 h-16 mx-auto text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20h8v-2a3 3 0 00-2.464-2.948M9 20H4v-2a3 3 0 015.196-2.121M9 20v-1a3 3 0 012.828-2.77M9 20v-1a3 3 0 012.828-2.77M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          Your feed is empty
        </h3>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Follow other users to see their posts in your home feed, or check out
          the Explore tab to discover new content!
        </p>
        <button
          @click="goToExplore"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Explore Posts
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="text-gray-500 mt-2">Loading your home feed...</p>
    </div>

    <!-- Posts from followed users -->
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
            class="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center cursor-pointer"
            @click="goToProfile(post.author?._id)"
          >
            <img
              v-if="post.author?.profilePicture"
              :src="post.author.profilePicture"
              :alt="post.author.username"
              class="w-full h-full rounded-full object-cover"
            />
            <User v-else class="w-full h-full p-1 text-white" />
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
        </div>
      </div>

      <!-- Post Image -->
      <div class="relative">
        <img
          :src="post.image"
          :alt="post.caption || 'Post image'"
          class="w-full h-96 object-cover"
          @error="handleImageError"
        />
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
              <Heart
                :class="[
                  'w-6 h-6',
                  isLiked(post) ? 'fill-current' : '',
                  likingPosts.includes(post._id) ? 'animate-pulse' : '',
                ]"
              />
            </button>
            <button
              @click="openCommentDialog(post)"
              class="hover:text-gray-600 transition-colors p-1"
            >
              <MessageCircle class="w-6 h-6" />
            </button>
          </div>
          <button
            @click="bookmarkPost(post._id)"
            :class="[
              'hover:text-gray-600 transition-colors p-1',
              isBookmarked(post) ? 'text-blue-500' : '',
            ]"
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
          <span class="ml-2">{{ post.caption }}</span>
        </div>

        <!-- Comments Preview -->
        <div v-if="post.comments && post.comments.length > 0" class="mb-2">
          <button
            @click="openCommentDialog(post)"
            class="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            View all {{ post.comments.length }} comments
          </button>
          <div
            v-for="comment in post.comments.slice(0, 2)"
            :key="comment._id"
            class="text-sm mb-1"
          >
            <span class="font-semibold inline-flex items-center">
              {{ comment.author?.username }}
              <VerifiedBadge
                :isVerified="comment.author?.isVerified"
                size="small"
              />
            </span>
            <span class="ml-2">{{ comment.text }}</span>
          </div>
        </div>

        <!-- Quick Comment -->
        <form
          @submit.prevent="addQuickComment(post._id)"
          class="flex items-center space-x-2 mt-3"
        >
          <div
            class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"
          >
            <img
              v-if="authStore.user?.profilePicture"
              :src="authStore.user.profilePicture"
              :alt="authStore.user.username"
              class="w-full h-full rounded-full object-cover"
            />
            <User v-else class="w-full h-full p-1 text-white" />
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

    <!-- Info message about home feed -->
    <div v-if="!loading && posts.length > 0" class="text-center py-6">
      <p class="text-gray-500 text-sm">
        You're viewing posts from users you follow
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useSocketStore } from "../stores/socket.js";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { Heart, MessageCircle, Bookmark, User, Trash2 } from "lucide-vue-next";
import CommentDialog from "./CommentDialog.vue";
import VerifiedBadge from "./VerifiedBadge.vue";
import { toast } from "vue3-toastify";

const router = useRouter();
const authStore = useAuthStore();
const socketStore = useSocketStore();

// Navigation to explore page
const goToExplore = () => {
  router.push({ name: "Explore" });
};

// State
const posts = ref([]);
const loading = ref(true);
const likingPosts = ref([]);
const deletingPosts = ref([]);
const quickComments = reactive({});
const addingQuickComment = reactive({});

// Comment dialog
const showCommentDialog = ref(false);
const selectedPost = ref(null);

// Navigation
function goToProfile(userId) {
  if (userId) {
    router.push({ name: "Profile", params: { id: userId } });
  }
}

// Fetch home feed (posts from followed users)
const fetchHomeFeed = async () => {
  try {
    loading.value = true;
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login to view your home feed");
      return;
    }

    const response = await axios.get("http://localhost:3000/api/v1/post/home", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    if (response.data.success) {
      posts.value = response.data.posts || [];
    } else {
      toast.error("Failed to load home feed");
    }
  } catch (error) {
    console.error("Error fetching home feed:", error);
    toast.error("Failed to load home feed");
  } finally {
    loading.value = false;
  }
};

// Like functionality
const likePost = async (postId) => {
  try {
    likingPosts.value.push(postId);

    const postIndex = posts.value.findIndex((p) => p._id === postId);
    if (postIndex === -1) return;

    const post = posts.value[postIndex];
    const isCurrentlyLiked = post.likes.some(
      (like) => (like._id || like) === authStore.user._id
    );

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
      const responseData = response.data;

      if (responseData.isLiked) {
        if (
          !post.likes.some((like) => (like._id || like) === authStore.user._id)
        ) {
          post.likes.push(authStore.user._id);
        }
        toast.success("Post liked!");
      } else {
        post.likes = post.likes.filter(
          (like) => (like._id || like) !== authStore.user._id
        );
        toast.success("Post unliked!");
      }

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

// Check if post is liked by current user
const isLiked = (post) => {
  return (
    authStore.user &&
    post.likes &&
    post.likes.some((like) => (like._id || like) === authStore.user._id)
  );
};

// Check if post is bookmarked by current user
const isBookmarked = (post) => {
  return (
    authStore.user &&
    authStore.user.bookmarks &&
    authStore.user.bookmarks.includes(post._id)
  );
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
};

// Handle image error
const handleImageError = (event) => {
  event.target.src = "/placeholder-image.jpg";
};

// Comment dialog functions
const openCommentDialog = (post) => {
  selectedPost.value = post;
  showCommentDialog.value = true;
};

const onCommentAdded = (comment) => {
  if (selectedPost.value) {
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

// Quick comment
const addQuickComment = async (postId) => {
  const commentText = quickComments[postId]?.trim();
  if (!commentText) return;

  try {
    addingQuickComment[postId] = true;
    const token = sessionStorage.getItem("token");

    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${postId}/comment`,
      { text: commentText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      const comment = response.data.comment;
      const postIndex = posts.value.findIndex((p) => p._id === postId);
      if (postIndex !== -1) {
        if (!posts.value[postIndex].comments) {
          posts.value[postIndex].comments = [];
        }
        posts.value[postIndex].comments.push(comment);
      }
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

// Delete post
const deletePost = async (postId) => {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    deletingPosts.value.push(postId);
    const token = sessionStorage.getItem("token");

    const response = await axios.delete(
      `http://localhost:3000/api/v1/post/delete/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      posts.value = posts.value.filter((post) => post._id !== postId);
      toast.success("Post deleted successfully!");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    toast.error("Failed to delete post");
  } finally {
    deletingPosts.value = deletingPosts.value.filter((id) => id !== postId);
  }
};

// Bookmark post
const bookmarkPost = async (postId) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await axios.post(
      `http://localhost:3000/api/v1/post/${postId}/bookmark`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      // Update user's bookmarks in auth store
      if (isBookmarked({ _id: postId })) {
        authStore.user.bookmarks = authStore.user.bookmarks.filter(
          (id) => id !== postId
        );
        toast.success("Removed from bookmarks");
      } else {
        if (!authStore.user.bookmarks) {
          authStore.user.bookmarks = [];
        }
        authStore.user.bookmarks.push(postId);
        toast.success("Added to bookmarks");
      }
    }
  } catch (error) {
    console.error("Error bookmarking post:", error);
    toast.error("Failed to bookmark post");
  }
};

// Socket setup for real-time updates
onMounted(() => {
  fetchHomeFeed();

  // Setup socket listeners for real-time like updates
  const socket = socketStore.getSocket();
  if (socket) {
    const handleLikeUpdate = (data) => {
      if (data.excludeUserId && data.excludeUserId === authStore.user?._id) {
        return;
      }

      const postIndex = posts.value.findIndex((p) => p._id === data.postId);
      if (postIndex !== -1) {
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
  }
});

onUnmounted(() => {
  const socket = socketStore.getSocket();
  if (socket) {
    socket.off("postLikeUpdate");
  }
});
</script>

<style scoped></style>
