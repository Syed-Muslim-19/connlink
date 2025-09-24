<template>
  <div class="max-w-2xl mx-auto p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Posts Feed</h1>
      <p class="text-gray-600">{{ postsCount }} posts</p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"
      ></div>
      <p class="text-gray-600 mt-2">Loading posts...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
    >
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="refreshPosts"
        class="mt-2 text-sm text-red-700 hover:text-red-900 underline"
      >
        Try again
      </button>
    </div>

    <!-- Posts list -->
    <div v-else-if="posts.length > 0" class="space-y-6">
      <div
        v-for="post in posts"
        :key="post._id"
        class="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <!-- Post header -->
        <div class="p-4 flex items-center space-x-3">
          <img
            :src="post.author.profilePicture || '/default-avatar.png'"
            :alt="post.author.username"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 class="font-semibold text-gray-900 flex items-center">
              {{ post.author.username }}
              <VerifiedBadge :isVerified="post.author.isVerified" size="small" />
            </h3>
            <p class="text-sm text-gray-500">
              {{ formatDate(post.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Post image -->
        <div v-if="post.image" class="aspect-square">
          <img
            :src="post.image"
            :alt="post.caption"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Post content -->
        <div class="p-4">
          <!-- Actions -->
          <div class="flex items-center space-x-4 mb-3">
            <button
              @click="toggleLike(post._id)"
              class="flex items-center space-x-1 text-gray-600 hover:text-pink-500"
            >
              <svg
                class="w-6 h-6"
                :class="{ 'text-pink-500 fill-current': post.isLiked }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{{ post.likes?.length || 0 }}</span>
            </button>

            <button
              class="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{{ post.comments?.length || 0 }}</span>
            </button>
          </div>

          <!-- Caption -->
          <p v-if="post.caption" class="text-gray-900 mb-2">
            <span class="font-semibold inline-flex items-center">
              {{ post.author.username }}
              <VerifiedBadge :isVerified="post.author.isVerified" size="small" />
            </span>
            {{ post.caption }}
          </p>

          <!-- Comments preview -->
          <div
            v-if="post.comments && post.comments.length > 0"
            class="space-y-1"
          >
            <p
              v-for="comment in post.comments.slice(0, 2)"
              :key="comment._id"
              class="text-sm text-gray-700"
            >
              <span class="font-semibold inline-flex items-center">
                {{ comment.author.username }}
                <VerifiedBadge :isVerified="comment.author.isVerified" size="small" />
              </span>
              {{ comment.text }}
            </p>
            <button
              v-if="post.comments.length > 2"
              class="text-sm text-gray-500 hover:text-gray-700"
            >
              View all {{ post.comments.length }} comments
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
      <p class="mt-1 text-sm text-gray-500">
        Start by creating your first post!
      </p>
    </div>

    <!-- Load more button -->
    <div v-if="hasMore && posts.length > 0" class="text-center mt-6">
      <button
        @click="loadMore"
        :disabled="isLoading"
        class="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
      >
        {{ isLoading ? "Loading..." : "Load More" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { usePostStore } from "../stores/posts.js";
import { useAuthStore } from "../stores/auth.js";
import VerifiedBadge from "./VerifiedBadge.vue";

// Get stores
const postStore = usePostStore();
const authStore = useAuthStore();

// Computed properties (like getters)
const posts = computed(() => postStore.allPosts);
const isLoading = computed(() => postStore.isLoading);
const error = computed(() => postStore.error);
const postsCount = computed(() => postStore.postsCount);
const hasMore = computed(() => postStore.hasMore);

// Actions
const refreshPosts = async () => {
  await postStore.refreshPosts();
};

const loadMore = async () => {
  await postStore.loadMorePosts();
};

const toggleLike = async (postId) => {
  await postStore.likePost(postId);
};

// Utility functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Load posts when component mounts
onMounted(async () => {
  if (posts.value.length === 0) {
    await postStore.fetchPosts();
  }
});
</script>
