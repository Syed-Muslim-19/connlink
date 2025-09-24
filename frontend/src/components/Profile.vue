<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useUserProfile } from "../composables/useUserProfile.js";
import { toast } from "vue3-toastify";
import FollowersModal from "./FollowersModal.vue";
import CommentDialog from "./CommentDialog.vue";

// Get route and auth
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);

// Use user profile composable
const {
  userProfile,
  userPosts,
  isLoading,
  isFollowing,
  setUserProfile,
  getUserProfile,
  getUserPosts,
  followUser,
} = useUserProfile();

// Tab state
const activeTab = ref("posts"); // 'posts' or 'saved'

// Modal state for followers/following
const showFollowersModal = ref(false);
const modalType = ref("followers"); // 'followers' or 'following'

// Post modal state for Instagram-style view
const showPostModal = ref(false);
const selectedPost = ref(null);

// Computed properties
const isOwnProfile = computed(() => {
  const userId = route.params.id;
  const currentUserId = currentUser.value?._id;

  // Only allow editing if we have a current user and the IDs match
  if (!currentUserId) return false;

  return currentUserId === userId || userId === "me";
});

const profileUser = computed(() => {
  // Always use fetched profile data when available, regardless of own profile or not
  // This ensures we always show the most up-to-date data from the backend
  if (userProfile.value) {
    return userProfile.value;
  }
  // Fallback to current user only if profile hasn't been fetched yet
  if (isOwnProfile.value) {
    return currentUser.value;
  }
  return null;
});

// Get bookmarked posts from the profile data
const savedPosts = computed(() => {
  return profileUser.value?.bookmarks || [];
});

// Fetch user profile and posts
const fetchUserProfile = async () => {
  try {
    // Handle 'me' route parameter
    let userId = route.params.id;
    if (userId === "me") {
      if (!currentUser.value?._id) {
        console.log("🔴 Current user not loaded, waiting...");
        // Don't show error immediately, wait a bit for auth to load
        setTimeout(() => {
          if (!currentUser.value?._id) {
            toast.error("Please wait, loading user data...");
          }
        }, 1000);
        return;
      }
      userId = currentUser.value._id;

      // Update the URL to use the actual user ID instead of 'me'
      router.replace(`/profile/${userId}`);
    }

    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    console.log("🟡 Fetching complete profile data for:", userId, {
      routeParam: route.params.id,
      currentUserId: currentUser.value?._id,
      isOwnProfile: isOwnProfile.value,
    });

    // Fetch user profile
    const profile = await getUserProfile(userId);

    if (profile) {
      // Check if following (for other users' profiles)
      if (!isOwnProfile.value && currentUser.value) {
        isFollowing.value =
          profile.followers?.some(
            (follower) =>
              (typeof follower === "object" ? follower._id : follower) ===
              currentUser.value._id
          ) || false;
      }

      // Fetch user posts
      await getUserPosts(userId);

      console.log("🟢 Complete profile data loaded:", {
        user: profile.username,
        postsCount: userPosts.value.length,
        isOwnProfile: isOwnProfile.value,
        followersCount: profile.followers?.length || 0,
        followingCount: profile.following?.length || 0,
      });
    } else {
      console.log("🔴 Profile not found for userId:", userId);
    }
  } catch (error) {
    console.error("🔴 Error in fetchUserProfile:", error);
  }
};

// Follow/Unfollow user
const toggleFollow = async () => {
  try {
    const response = await followUser(route.params.id);

    if (response && response.success) {
      isFollowing.value = !isFollowing.value;

      // Refresh the profile to get updated counts
      await fetchUserProfile();
    }
  } catch (error) {
    console.error("🔴 Error toggling follow:", error);
  }
};

// Tab switching function
const switchTab = (tab) => {
  activeTab.value = tab;
  console.log("🟡 Switched to tab:", tab);
};

// Modal functions
const openFollowersModal = () => {
  modalType.value = "followers";
  showFollowersModal.value = true;
};

const openFollowingModal = () => {
  modalType.value = "following";
  showFollowersModal.value = true;
};

const closeModal = () => {
  showFollowersModal.value = false;
};

// Post modal functions
const openPostModal = (post) => {
  selectedPost.value = post;
  showPostModal.value = true;
};

const closePostModal = () => {
  showPostModal.value = false;
  selectedPost.value = null;
};

// Navigate to edit profile
const navigateToEditProfile = () => {
  router.push("/account/edit");
};

// Initialize on mount and watch route changes
onMounted(() => {
  console.log("🟡 Profile mounted with route:", route.params.id);
  console.log("🟡 Auth store in Profile:", authStore);
  console.log("🟡 Current user on mount:", currentUser.value);
  console.log("🟡 Auth store user:", authStore.user);
  console.log("🟡 Auth store currentUser:", authStore.currentUser);
  fetchUserProfile();
});

// Watch route changes to reload profile data
watch(
  () => route.params.id,
  (newId, oldId) => {
    console.log("🟡 Route changed from", oldId, "to", newId);
    if (newId) {
      fetchUserProfile();
    }
  }
);

// Watch currentUser changes to handle 'me' profile loading
watch(
  () => currentUser.value,
  (newUser, oldUser) => {
    console.log(
      "🟡 Profile: CurrentUser changed from",
      oldUser?.username,
      "to",
      newUser?.username
    );
    console.log("🟡 Profile: Current route param:", route.params.id);
    if (newUser && route.params.id === "me") {
      console.log("🟡 Current user loaded, fetching profile...");
      fetchUserProfile();
    }
  },
  { immediate: true }
);

// Also watch the auth store user directly
watch(
  () => authStore.user,
  (newUser) => {
    console.log("🟡 Profile: AuthStore user changed:", newUser?.username);
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-6xl mx-auto p-2 sm:p-4 md:p-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"
        ></div>
        <p class="text-gray-600 mt-4">Loading profile...</p>
      </div>

      <!-- Profile Content -->
      <div v-else-if="profileUser" class="space-y-6">
        <!-- Profile Header - Instagram Style -->
        <div
          class="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-sm px-3 sm:px-6 md:px-8 py-6 md:py-8"
        >
          <div class="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            <!-- Profile Avatar - Left Side -->
            <div class="flex-shrink-0">
              <div
                v-if="!profileUser.profilePicture"
                class="w-28 h-28 md:w-32 md:h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <span class="text-white font-bold text-3xl md:text-4xl">
                  {{ (profileUser.username || "U").charAt(0).toUpperCase() }}
                </span>
              </div>
              <img
                v-else
                :src="profileUser.profilePicture"
                :alt="profileUser.username"
                class="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-100"
              />
            </div>

            <!-- User Details - Right Side -->
            <div class="flex-1 max-w-2xl">
              <!-- Username Row -->
              <div class="mb-6">
                <h1 class="text-2xl md:text-3xl font-light text-gray-800">
                  {{ profileUser.username || "Unknown User" }}
                </h1>
              </div>
              <!-- Stats Row -->
              <div class="flex gap-8 mb-6">
                <div class="text-center sm:text-left">
                  <span class="font-semibold text-gray-800 mr-1">{{
                    userPosts.length
                  }}</span>
                  <span class="text-gray-600">posts</span>
                </div>
                <div
                  class="text-center sm:text-left cursor-pointer hover:opacity-70 transition-opacity"
                  @click="openFollowersModal"
                >
                  <span class="font-semibold text-gray-800 mr-1">{{
                    profileUser.followers?.length || 0
                  }}</span>
                  <span class="text-gray-600">followers</span>
                </div>
                <div
                  class="text-center sm:text-left cursor-pointer hover:opacity-70 transition-opacity"
                  @click="openFollowingModal"
                >
                  <span class="font-semibold text-gray-800 mr-1">{{
                    profileUser.following?.length || 0
                  }}</span>
                  <span class="text-gray-600">following</span>
                </div>
              </div>

              <!-- Name and Bio -->
              <div class="space-y-1 mb-6">
                <div class="font-semibold text-gray-800">
                  {{ profileUser.fullName || profileUser.username }}
                </div>
                <div
                  v-if="profileUser.bio"
                  class="text-gray-800 whitespace-pre-line"
                >
                  {{ profileUser.bio }}
                </div>
              </div>

              <!-- Action Buttons Container -->
              <div
                class="bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 p-4"
              >
                <!-- Own Profile: Edit Button -->
                <div v-if="isOwnProfile" class="w-full">
                  <button
                    @click="navigateToEditProfile"
                    class="w-full px-8 py-3 text-sm font-semibold bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Edit profile
                  </button>
                </div>

                <!-- Other User's Profile - Not Following: Follow Button Only -->
                <div v-else-if="!isOwnProfile && !isFollowing" class="w-full">
                  <button
                    @click="toggleFollow"
                    class="w-full px-8 py-3 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Follow
                  </button>
                </div>

                <!-- Other User's Profile - Following: Unfollow + Message Buttons -->
                <div
                  v-else-if="!isOwnProfile && isFollowing"
                  class="flex gap-3 w-full"
                >
                  <button
                    @click="toggleFollow"
                    class="flex-1 px-6 py-3 text-sm font-semibold bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
                  >
                    Following
                  </button>
                  <button
                    class="flex-1 px-6 py-3 text-sm font-semibold bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider Line -->
        <div class="border-t border-gray-200"></div>

        <!-- Posts Section -->
        <div
          class="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 px-2 sm:px-4 md:px-8 py-6"
        >
          <!-- Tab Navigation -->
          <div class="flex justify-center mb-8">
            <div class="flex border-t border-gray-200 -mt-px">
              <button
                @click="switchTab('posts')"
                :class="
                  activeTab === 'posts'
                    ? 'text-gray-900 border-t border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                "
                class="flex items-center px-4 py-3 text-sm font-medium transition-colors"
              >
                <svg
                  class="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 3h7v7H3V3zm0 11h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"
                  />
                </svg>
                POSTS
              </button>
              <button
                v-if="isOwnProfile"
                @click="switchTab('saved')"
                :class="
                  activeTab === 'saved'
                    ? 'text-gray-900 border-t border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                "
                class="flex items-center px-4 py-3 text-sm font-medium transition-colors"
              >
                <svg
                  class="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 5a2 2 0 012-2h10a2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                SAVED
              </button>
            </div>
          </div>

          <!-- Posts Grid -->
          <div
            v-if="activeTab === 'posts' && userPosts.length > 0"
            class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto"
          >
            <div
              v-for="post in userPosts"
              :key="post._id"
              @click="openPostModal(post)"
              class="group cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity w-full"
            >
              <img
                :src="post.image"
                :alt="post.caption"
                class="w-full h-full object-cover"
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
                      <span class="font-semibold">{{
                        post.likes?.length || 0
                      }}</span>
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

          <!-- Posts Empty State -->
          <div
            v-else-if="activeTab === 'posts'"
            class="text-center py-16 max-w-xs mx-auto"
          >
            <div
              class="w-16 h-16 mx-auto mb-6 border-2 border-gray-300 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-light text-gray-800 mb-1">
              {{ isOwnProfile ? "Share Photos" : "No Posts Yet" }}
            </h3>
            <p class="text-gray-600 text-sm">
              {{
                isOwnProfile
                  ? "When you share photos, they will appear on your profile."
                  : "When they share photos, you'll see them here."
              }}
            </p>
          </div>

          <!-- Saved Posts Grid -->
          <div
            v-if="activeTab === 'saved' && savedPosts.length > 0"
            class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto"
          >
            <div
              v-for="post in savedPosts"
              :key="post._id"
              class="group cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity w-full"
            >
              <img
                :src="post.image"
                :alt="post.caption"
                class="w-full h-full object-cover"
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
                      <span class="font-semibold">{{
                        post.likes?.length || 0
                      }}</span>
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

              <!-- Saved indicator icon -->
              <div class="absolute top-2 right-2">
                <svg
                  class="w-5 h-5 text-white drop-shadow-lg fill-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Saved Posts Empty State -->
          <div
            v-else-if="activeTab === 'saved'"
            class="text-center py-16 max-w-xs mx-auto"
          >
            <div
              class="w-16 h-16 mx-auto mb-6 border-2 border-gray-300 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-light text-gray-800 mb-1">
              {{ isOwnProfile ? "No Saved Posts" : "No Saved Posts" }}
            </h3>
            <p class="text-gray-600 text-sm">
              {{
                isOwnProfile
                  ? "Save posts you'd like to see again."
                  : "You haven't saved any posts yet."
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <div class="text-gray-500">
          <svg
            class="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L3.25 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-800 mb-2">
            Profile not found
          </h3>
          <p class="text-gray-600">This user profile could not be loaded.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Followers/Following Modal -->
  <FollowersModal
    :show="showFollowersModal"
    :userId="route.params.id"
    :type="modalType"
    @close="closeModal"
  />

  <!-- Post Modal (Instagram-style) -->
  <CommentDialog
    :show="showPostModal"
    :postData="selectedPost"
    :comments="selectedPost?.comments || []"
    @close="closePostModal"
  />
</template>

<style scoped></style>
