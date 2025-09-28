<script setup>
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useStores.js";
import { useRouter } from "vue-router";
import axios from "axios";
import { toast } from "vue3-toastify";
import VerifiedBadge from "./VerifiedBadge.vue";

// Get current user from auth store
const { currentUser } = useAuth();

// Router for navigation
const router = useRouter();

// Reactive state
const suggestedUsers = ref([]);
const isLoading = ref(false);

// Fetch suggested users from API
const fetchSuggestedUsers = async () => {
  try {
    isLoading.value = true;

    // Get token from auth store first, fallback to sessionStorage
    const { token: authToken } = useAuth();
    const token = authToken || sessionStorage.getItem("token");

    console.log("🔍 RightSidebar: Checking auth token:", token ? "YES" : "NO");

    if (!token) {
      console.log("🟡 No token found, skipping suggested users fetch");
      toast.info("Please log in to see suggestions");
      return;
    }

    console.log(
      "🟡 Fetching suggested users from:",
      "http://localhost:3000/api/v1/user/suggested"
    );

    const response = await axios.get(
      "http://localhost:3000/api/v1/user/suggested",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("🟢 API Response:", response.data);

    if (response.data.success && response.data.users) {
      // Filter out current user and limit to 4 users
      const filteredUsers = response.data.users
        .filter((user) => user._id !== currentUser.value?._id)
        .slice(0, 4);

      suggestedUsers.value = filteredUsers;
      console.log("🟢 Suggested users fetched:", suggestedUsers.value.length);
      console.log(
        "🟢 Users data:",
        suggestedUsers.value.map((u) => ({ id: u._id, username: u.username }))
      );
    } else {
      console.log("🟡 No suggested users found or API returned error");
      suggestedUsers.value = [];
    }
  } catch (error) {
    console.error("🔴 Error fetching suggested users:", error);
    toast.error("Failed to load suggested users");
    suggestedUsers.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Follow/Unfollow user function
const followUser = async (userId) => {
  try {
    // Get token from auth store first, fallback to sessionStorage
    const { token: authToken } = useAuth();
    const token = authToken || sessionStorage.getItem("token");

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
      // Update the user's follow status locally
      const userIndex = suggestedUsers.value.findIndex(
        (user) => user._id === userId
      );
      if (userIndex !== -1) {
        // For simplicity, just show a success message and remove from suggestions
        toast.success(response.data.message);
        suggestedUsers.value.splice(userIndex, 1);
      }
    }
  } catch (error) {
    console.error("🔴 Error following user:", error);
    toast.error("Failed to follow user");
  }
};

// Navigation functions
const navigateToProfile = (userId) => {
  if (userId) {
    console.log("🟡 Navigating to profile:", userId);
    router.push(`/profile/${userId}`);
  }
};

const navigateToCurrentUserProfile = () => {
  if (currentUser.value?._id) {
    console.log(
      "🟡 Navigating to current user profile:",
      currentUser.value._id
    );
    router.push(`/profile/${currentUser.value._id}`);
  }
};

// Initialize on mount
onMounted(() => {
  fetchSuggestedUsers();
});
</script>

<template>
  <!-- Right Sidebar Container - Clean interface with proper layout -->
  <div class="w-full max-w-sm mx-auto">
    <div
      class="relative h-[45vh] min-h-[400px] overflow-hidden rounded-2xl border border-gray-300"
    >
      <!-- Sidebar content with enhanced glassmorphism effect -->
      <div
        class="relative z-10 h-full flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        style="
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        "
      >
        <!-- Current User Section -->
        <div class="p-4 flex-shrink-0 border-b border-white/10">
          <router-link
            to="/profile/me"
            @click="showMobileMenu = false"
            class="flex items-center text-gray-900 rounded-lg transition-all duration-300"
          >
            <div
              class="flex items-center space-x-3 p-3 bg-black/5 rounded-lg backdrop-blur-sm hover:bg-black/10 transition-all duration-200 cursor-pointer"
              @click="navigateToCurrentUserProfile"
            >
              <!-- User Avatar -->

              <div
                v-if="!currentUser?.profilePicture"
                class="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <span class="text-gray-900 font-bold text-base">
                  {{ (currentUser?.username || "U").charAt(0).toUpperCase() }}
                </span>
              </div>
              <img
                v-else
                :src="currentUser.profilePicture"
                :alt="currentUser.username"
                class="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />

              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <h3
                  class="text-gray-900 font-semibold text-sm truncate flex items-center"
                >
                  {{ currentUser?.username || "Guest" }}
                  <VerifiedBadge
                    :isVerified="currentUser?.isVerified"
                    size="small"
                  />
                </h3>
                <p class="text-gray-700 text-sm">
                  {{ currentUser?.bio || "No Bio yet..." }}
                </p>
              </div>
            </div>
          </router-link>
        </div>

        <!-- Suggested Users Section -->
        <div class="px-4 py-4 flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-3 flex-shrink-0">
            <h4 class="text-gray-900 font-medium text-sm">Suggested for you</h4>
            <button
              @click="fetchSuggestedUsers"
              class="text-gray-700 text-xs hover:text-gray-900 transition-colors"
            >
              See All
            </button>
          </div>

          <!-- Loading State (4 skeleton items) -->
          <div v-if="isLoading" class="space-y-2 flex-1">
            <div
              v-for="i in 4"
              :key="i"
              class="flex items-center space-x-3 p-2"
            >
              <div class="w-8 h-8 bg-black/20 rounded-full animate-pulse"></div>
              <div class="flex-1">
                <div class="h-3 bg-black/20 rounded animate-pulse mb-1"></div>
                <div class="h-2 bg-black/20 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>

          <!-- Suggested Users List (Maximum 4) -->
          <div v-else-if="suggestedUsers.length > 0" class="space-y-2 flex-1">
            <div
              v-for="user in suggestedUsers"
              :key="user._id"
              class="flex items-center space-x-3 p-2 hover:bg-black/5 rounded-lg transition-all duration-200 cursor-pointer"
              @click="navigateToProfile(user._id)"
            >
              <!-- User Avatar -->
              <div
                v-if="!user.profilePicture"
                class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <span class="text-gray-900 font-semibold text-sm">
                  {{ (user.username || "U").charAt(0).toUpperCase() }}
                </span>
              </div>
              <img
                v-else
                :src="user.profilePicture"
                :alt="user.username"
                class="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />

              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <h5
                  class="text-gray-900 font-medium text-xs truncate flex items-center"
                >
                  {{ user.username || "Unknown User" }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </h5>
                <p class="text-gray-600 text-xs">Suggested for you</p>
              </div>

              <!-- Follow Button -->
              <button
                @click.stop="followUser(user._id)"
                class="text-blue-600 text-xs font-medium hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-black/10"
              >
                Follow
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6">
            <p class="text-gray-600 text-sm">No suggestions available</p>
          </div>

          <!-- Footer Links - Compact version -->
          <div class="mt-4 pt-4 border-t border-black/20 flex-shrink-0">
            <div class="text-gray-500 text-sm">
              <div class="flex flex-wrap gap-x-2 gap-y-1 mb-2"></div>
              <div>
                <p class="text-gray-400">© 2025 ConnLink</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for consistency */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
