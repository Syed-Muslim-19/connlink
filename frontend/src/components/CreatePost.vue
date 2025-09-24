<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { usePostStore } from "../stores/posts.js";
import { toast } from "vue3-toastify";

// Get stores
const authStore = useAuthStore();
const postStore = usePostStore();
const user = computed(() => authStore.currentUser);

// Form state
const file = ref(null);
const caption = ref("");
const imagePreview = ref(null);
// Use store's loading state
const isPosting = computed(() => postStore.isLoading);

// File change handler
const fileChangeHandler = (event) => {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    file.value = selectedFile;

    // Convert file to dataURL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
  }
};

// Create post handler using Pinia store
const createPostHandler = async (e) => {
  try {
    // Debug authentication state
    console.log("🔍 CreatePost: Auth debugging:");
    console.log("🔍 CreatePost: authStore.isAuthenticated:", authStore.isAuthenticated);
    console.log("🔍 CreatePost: authStore.token:", authStore.token);
    console.log("🔍 CreatePost: authStore.user:", authStore.user);
    console.log("🔍 CreatePost: sessionStorage token:", sessionStorage.getItem("token"));
    console.log("🔍 CreatePost: sessionStorage user:", sessionStorage.getItem("user"));

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.log("🔴 CreatePost: User not authenticated");
      toast.error("Please login to create a post");
      return;
    }

    console.log("Starting post creation via Pinia store...");
    console.log("Caption:", caption.value);
    console.log("File:", file.value);

    // Validate required fields
    if (!file.value) {
      toast.error("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption.value);
    formData.append("image", file.value);

    console.log("FormData prepared, calling store...");

    // Use Pinia store to create post
    const result = await postStore.createPost(formData);

    console.log("Store result:", result);

    if (result.success) {
      toast.success(result.message || "Post created successfully!");
      resetForm();
      console.log("Post created and added to store:", result.post);
    } else {
      console.error("Post creation failed:", result.message);
      toast.error(result.message || "Failed to create post");
    }
  } catch (error) {
    console.error("=== COMPLETE ERROR DEBUG ===");
    console.error("Error:", error);
    console.error("=============================");

    toast.error("An unexpected error occurred. Please try again.");
  }
};

// Reset form
const resetForm = () => {
  file.value = null;
  caption.value = "";
  imagePreview.value = null;
  // Reset file input
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = "";
};
</script>

<template>
  <!-- Create Post Page -->
  <div class="max-w-2xl mx-auto p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 text-center">
        Create new post
      </h1>
    </div>

    <!-- Main Content Card -->
    <div
      class="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
    >
      <div class="p-6 space-y-6">
        <!-- User Profile Section -->
        <div class="flex items-center">
          <!-- Profile Picture -->
          <div
            class="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
          >
            {{ user?.username?.charAt(0).toUpperCase() || "U" }}
          </div>
          <!-- Username -->
          <div class="ml-3">
            <span class="font-semibold text-gray-900">{{
              user?.username || "User"
            }}</span>
            <p class="text-sm text-gray-500">Share a new post</p>
          </div>
        </div>

        <!-- Image Upload/Preview Section -->
        <div class="relative">
          <div v-if="!imagePreview" class="mb-4">
            <label class="block cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                @change="fileChangeHandler"
                class="hidden"
              />
              <div
                class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all duration-200"
              >
                <div class="space-y-3">
                  <div
                    class="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-gray-700">
                      Select photos from your device
                    </p>
                    <p class="text-sm text-gray-500">or drag and drop</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <!-- Image Preview -->
          <div v-if="imagePreview" class="space-y-4">
            <div class="relative rounded-xl overflow-hidden shadow-lg">
              <img
                :src="imagePreview"
                alt="Preview"
                class="w-full h-80 object-cover"
              />
              <button
                @click="resetForm"
                class="absolute top-3 right-3 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Caption Textarea -->
        <div>
          <textarea
            v-model="caption"
            placeholder="Write a caption..."
            rows="4"
            class="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
          ></textarea>
          <div class="flex justify-between items-center mt-2">
            <span class="text-sm text-gray-400">{{ caption.length }}/2200</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            @click="resetForm"
            class="px-6 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
          <button
            v-if="file"
            @click="createPostHandler"
            :disabled="isPosting"
            class="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            <span v-if="isPosting" class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sharing...
            </span>
            <span v-else>Share</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
