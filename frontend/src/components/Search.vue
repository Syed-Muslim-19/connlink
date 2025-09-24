<template>
  <div class="flex h-full">
    <!-- Main Content Area -->
    <div class="flex-1 max-w-2xl mx-auto">
      <!-- Page Header -->
      <div class="px-4 py-6 border-b border-gray-200 mb-4">
        <h1 class="text-2xl font-bold text-gray-900">Search</h1>
        <p class="text-gray-600 mt-1">Find users by their username or email</p>
      </div>

      <!-- Search Input -->
      <div class="px-4 mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search for users..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              class="w-5 h-5 text-gray-400"
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
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
        ></div>
        <p class="text-gray-500 mt-2">Searching...</p>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchResults.length > 0" class="px-4">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
        <div class="space-y-4">
          <div
            v-for="user in searchResults"
            :key="user._id"
            class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center space-x-4">
              <!-- User Avatar -->
              <div
                class="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center cursor-pointer"
                @click="goToProfile(user._id)"
              >
                <img
                  v-if="user.profilePicture"
                  :src="user.profilePicture"
                  :alt="user.username"
                  class="w-full h-full rounded-full object-cover"
                />
                <User v-else class="w-6 h-6 text-white" />
              </div>

              <!-- User Info -->
              <div class="cursor-pointer" @click="goToProfile(user._id)">
                <h3 class="font-semibold text-gray-900 flex items-center">
                  {{ user.username }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </h3>
                <p class="text-sm text-gray-600">{{ user.email }}</p>
                <p class="text-xs text-gray-500">
                  {{ user.followers?.length || 0 }} followers
                </p>
              </div>
            </div>

            <!-- Follow/Following Button -->
            <button
              v-if="user._id !== authStore.user?._id"
              @click="followUser(user._id)"
              :disabled="followingUsers.includes(user._id)"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isFollowing(user._id)
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600',
                followingUsers.includes(user._id)
                  ? 'opacity-50 cursor-not-allowed'
                  : '',
              ]"
            >
              {{
                followingUsers.includes(user._id)
                  ? "Loading..."
                  : isFollowing(user._id)
                  ? "Following"
                  : "Follow"
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchQuery.trim() === ''" class="text-center py-12">
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
            Search for users
          </h3>
          <p class="text-gray-500">
            Enter a username or email to find other users on ConnLink
          </p>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-12">
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
            No users found
          </h3>
          <p class="text-gray-500">
            Try searching with a different username or email
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import { User } from "lucide-vue-next";
import { toast } from "vue3-toastify";
import VerifiedBadge from "./VerifiedBadge.vue";

const router = useRouter();
const authStore = useAuthStore();

// State
const searchQuery = ref("");
const searchResults = ref([]);
const loading = ref(false);
const followingUsers = ref([]);

// Search functionality with debounce
let searchTimeout = null;

const handleSearch = () => {
  clearTimeout(searchTimeout);

  if (searchQuery.value.trim() === "") {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    await searchUsers();
  }, 500); // 500ms debounce
};

const searchUsers = async () => {
  try {
    loading.value = true;
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login to search users");
      return;
    }

    const response = await axios.get(
      `http://localhost:3000/api/v1/user/search?query=${encodeURIComponent(
        searchQuery.value.trim()
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      searchResults.value = response.data.users || [];
    } else {
      toast.error("Failed to search users");
    }
  } catch (error) {
    console.error("Error searching users:", error);
    toast.error("Failed to search users");
  } finally {
    loading.value = false;
  }
};

// Check if current user is following a user
const isFollowing = (userId) => {
  if (!authStore.user?.following) return false;
  return authStore.user.following.some(
    (followingUser) =>
      (typeof followingUser === "object"
        ? followingUser._id
        : followingUser) === userId
  );
};

// Follow/Unfollow functionality
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

      // Update the auth store with new counts
      if (response.data.action === "follow") {
        // User followed someone
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

        // Remove the followed user from search results
        searchResults.value = searchResults.value.filter(
          (user) => user._id !== userId
        );
      } else {
        // User unfollowed someone
        authStore.user.following = authStore.user.following.filter(
          (followingUser) =>
            (typeof followingUser === "object"
              ? followingUser._id
              : followingUser) !== userId
        );
      }

      // Refresh current user data from backend to get accurate counts
      await authStore.refreshCurrentUser();
    }
  } catch (error) {
    console.error("Error following user:", error);
    toast.error("Failed to follow/unfollow user");
  } finally {
    followingUsers.value = followingUsers.value.filter((id) => id !== userId);
  }
};

// Navigation
const goToProfile = (userId) => {
  if (userId) {
    router.push({ name: "Profile", params: { id: userId } });
  }
};
</script>

<style scoped></style>
