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
      class="relative h-[45vh] min-h-[400px] overflow-hidden rounded-2xl shadow-xl"
    >
      <!-- Background with gradient to match LeftSidebar -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500"
      >
        <!-- Background decorations -->
        <div class="absolute inset-0 overflow-hidden">
          <div
            class="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-3xl"
          ></div>
          <div
            class="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-pink-500/10 backdrop-blur-3xl"
          ></div>
          <div
            class="absolute top-1/3 right-1/2 transform translate-x-1/2 w-16 h-16 rounded-full bg-yellow-400/5 backdrop-blur-3xl"
          ></div>
        </div>
      </div>

      <!-- Sidebar content with glass-morphism -->
      <div
        class="relative z-10 h-full flex flex-col bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden"
      >
        <!-- Current User Section -->
        <div class="p-4 flex-shrink-0 border-b border-white/10">
          <div
            class="flex items-center space-x-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200 cursor-pointer"
            @click="navigateToCurrentUserProfile"
          >
            <!-- User Avatar -->
            <div
              v-if="!currentUser?.profilePicture"
              class="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-white font-bold text-base">
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
              <h3 class="text-white font-semibold text-sm truncate flex items-center">
                {{ currentUser?.username || "Guest" }}
                <VerifiedBadge :isVerified="currentUser?.isVerified" size="small" />
              </h3>
              <p class="text-white/70 text-sm">
                {{ currentUser?.bio || "Muslim Bukhari" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Suggested Users Section -->
        <div class="px-4 py-4 flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-3 flex-shrink-0">
            <h4 class="text-white font-medium text-sm">Suggested for you</h4>
            <button
              @click="fetchSuggestedUsers"
              class="text-white/70 text-xs hover:text-white transition-colors"
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
              <div class="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
              <div class="flex-1">
                <div class="h-3 bg-white/20 rounded animate-pulse mb-1"></div>
                <div class="h-2 bg-white/20 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>

          <!-- Suggested Users List (Maximum 4) -->
          <div v-else-if="suggestedUsers.length > 0" class="space-y-2 flex-1">
            <div
              v-for="user in suggestedUsers"
              :key="user._id"
              class="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer"
              @click="navigateToProfile(user._id)"
            >
              <!-- User Avatar -->
              <div
                v-if="!user.profilePicture"
                class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white font-semibold text-sm">
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
                <h5 class="text-white font-medium text-xs truncate flex items-center">
                  {{ user.username || "Unknown User" }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </h5>
                <p class="text-white/60 text-xs">Suggested for you</p>
              </div>

              <!-- Follow Button -->
              <button
                @click.stop="followUser(user._id)"
                class="text-blue-300 text-xs font-medium hover:text-blue-200 transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                Follow
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6">
            <p class="text-white/60 text-sm">No suggestions available</p>
          </div>

          <!-- Footer Links - Compact version -->
          <div class="mt-4 pt-4 border-t border-white/20 flex-shrink-0">
            <div class="text-white/40 text-sm">
              <div class="flex flex-wrap gap-x-2 gap-y-1 mb-2">
                <a href="#" class="hover:text-white/60 transition-colors"
                  >About</a
                >
                <span>•</span>
                <a href="#" class="hover:text-white/60 transition-colors"
                  >Help</a
                >
                <span>•</span>
                <a href="#" class="hover:text-white/60 transition-colors"
                  >Press</a
                >
                <span>•</span>
                <a href="#" class="hover:text-white/60 transition-colors"
                  >API</a
                >
              </div>
              <div>
                <p class="text-white/30">© 2025 PL-Media from Meta</p>
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
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
