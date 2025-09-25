<template>
  <div class="space-y-6">
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
      <p class="text-gray-500 mt-2">Discovering posts for you...</p>
    </div>

    <!-- Empty State for Explore Feed -->
    <div v-else-if="!loading && posts.length === 0" class="text-center py-12">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No posts to explore
        </h3>
        <p class="text-gray-500 mb-6">
          There are no posts from other users to discover right now. Check back
          later for new content!
        </p>
      </div>
    </div>

    <!-- Posts Grid (Profile-style) -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto"
    >
      <div
        v-for="post in posts"
        :key="post._id"
        @click="openCommentDialog(post)"
        class="group cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity w-full"
      >
        <img
          :src="post.image"
          :alt="post.caption || 'Post image'"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        <!-- Hover Overlay with Stats -->
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center"
        >
          <div
            class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
                <span class="font-semibold">{{ post.likes?.length || 0 }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path
                    d="M21 6h-2l-1.27-1.27c-.19-.19-.44-.29-.71-.29-.28 0-.53.11-.71.29L15 6H9L7.71 4.71c-.19-.19-.44-.29-.71-.29-.28 0-.53.11-.71.29L5 6H3c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1zm-9 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  />
                </svg>
                <span class="font-semibold">{{
                  post.comments?.length || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Multiple Images Indicator -->
        <div
          v-if="post.images && post.images.length > 1"
          class="absolute top-2 right-2"
        >
          <svg
            class="w-4 h-4 text-white drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11.5-6L8 13h12l-3.5-4.5-2.5 3.01L10.5 10z"
            />
            <path d="M2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Info message about explore feed -->
    <div v-if="!loading && posts.length > 0" class="text-center py-6">
      <p class="text-gray-500 text-sm">
        Discover posts from users around the community
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
import { Heart, MessageCircle, Bookmark, User } from "lucide-vue-next";
import CommentDialog from "./CommentDialog.vue";
import { toast } from "vue3-toastify";

const router = useRouter();
const authStore = useAuthStore();
const socketStore = useSocketStore();

// State
const posts = ref([]);
const loading = ref(true);
const likingPosts = ref([]);
const followingUsers = ref([]);
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

// Fetch explore feed (posts from users you don't follow)
const fetchExploreFeed = async () => {
  try {
    loading.value = true;
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login to explore posts");
      return;
    }

    const response = await axios.get(
      "http://localhost:3000/api/v1/post/explore",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      posts.value = response.data.posts || [];
    } else {
      toast.error("Failed to load explore feed");
    }
  } catch (error) {
    console.error("Error fetching explore feed:", error);
    toast.error("Failed to load explore feed");
  } finally {
    loading.value = false;
  }
};

// Follow user functionality
const followUser = async (userId) => {
  try {
    followingUsers.value.push(userId);
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

      // Update auth store following list
      if (response.data.action === "follow") {
        if (!authStore.user.following) {
          authStore.user.following = [];
        }
        // Check if already following (handle both populated objects and IDs)
        const isAlreadyFollowingUser = authStore.user.following.some(
          (followingUser) =>
            (typeof followingUser === "object"
              ? followingUser._id
              : followingUser) === userId
        );
        if (!isAlreadyFollowingUser) {
          authStore.user.following.push(userId);
        }

        // Refresh current user data from backend to get accurate counts
        await authStore.refreshCurrentUser();
      }

      // Remove the post from explore feed since user is now following
      posts.value = posts.value.filter((post) => post.author._id !== userId);
    }
  } catch (error) {
    console.error("Error following user:", error);
    toast.error("Failed to follow user");
  } finally {
    followingUsers.value = followingUsers.value.filter((id) => id !== userId);
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
  fetchExploreFeed();

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
