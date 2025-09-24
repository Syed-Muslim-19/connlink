<script setup>
import { ref, onMounted } from "vue";
import Post from "./Post.vue";
import { toast } from "vue3-toastify";
import axios from "axios";

// State
const posts = ref([]);
const loading = ref(false);
const error = ref(null);

// Fetch all posts function
const fetchAllPosts = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get("http://localhost:3000/api/v1/post/all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.data.success) {
      posts.value = response.data.posts;
      console.log("Posts fetched successfully:", posts.value.length);
    }
  } catch (err) {
    console.error("Error fetching posts:", err);
    error.value = err.response?.data?.message || "Error fetching posts";
    toast.error("Failed to load posts");
  } finally {
    loading.value = false;
  }
};

// Handle post deletion
const handlePostDeleted = (postId) => {
  posts.value = posts.value.filter((post) => post._id !== postId);
};

// Handle post update (for likes/comments)
const handlePostUpdated = async (postId) => {
  // Optionally refresh just this post or all posts
  await fetchAllPosts();
};

// Initialize posts on component mount
onMounted(() => {
  fetchAllPosts();
});
</script>

<template>
  <div class="max-w-md mx-auto py-4 px-2">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
      <span class="ml-2 text-gray-600">Loading posts...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-500 mb-4">{{ error }}</div>
      <button
        @click="fetchAllPosts"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry
      </button>
    </div>

    <!-- Posts List -->
    <div v-else-if="posts.length > 0" class="space-y-6">
      <Post
        v-for="post in posts"
        :key="post._id"
        :post-data="post"
        @post-deleted="handlePostDeleted"
        @post-updated="handlePostUpdated"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div class="text-gray-500 mb-4">No posts available</div>
      <button
        @click="fetchAllPosts"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles here */
</style>
