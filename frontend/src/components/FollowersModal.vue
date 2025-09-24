<template>
  <!-- Modal Overlay -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click="closeModal"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ type === 'followers' ? 'Followers' : 'Following' }}
        </h2>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <!-- Users List -->
      <div v-else class="flex-1 overflow-y-auto">
        <div v-if="users.length === 0" class="text-center py-8">
          <p class="text-gray-500">
            No {{ type === 'followers' ? 'followers' : 'following' }} found
          </p>
        </div>
        <div v-else class="p-4 space-y-3">
          <div
            v-for="user in users"
            :key="user._id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <!-- User Avatar -->
              <div
                class="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center cursor-pointer"
                @click="goToProfile(user._id)"
              >
                <img
                  v-if="user.profilePicture"
                  :src="user.profilePicture"
                  :alt="user.username"
                  class="w-full h-full rounded-full object-cover"
                />
                <User v-else class="w-5 h-5 text-white" />
              </div>

              <!-- User Info -->
              <div class="cursor-pointer" @click="goToProfile(user._id)">
                <h3 class="font-semibold text-gray-900 text-sm flex items-center">
                  {{ user.username }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </h3>
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
                'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                isFollowing(user._id)
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600',
                followingUsers.includes(user._id) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              {{ followingUsers.includes(user._id) ? "Loading..." : isFollowing(user._id) ? "Following" : "Follow" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import { User } from "lucide-vue-next";
import VerifiedBadge from "./VerifiedBadge.vue";
import { toast } from "vue3-toastify";

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['followers', 'following'].includes(value)
  }
});

const emit = defineEmits(['close']);

const router = useRouter();
const authStore = useAuthStore();

// State
const users = ref([]);
const loading = ref(false);
const followingUsers = ref([]);

// Watch for modal opening to fetch data
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      fetchUsers();
    } else {
      users.value = [];
    }
  }
);

// Fetch followers or following
const fetchUsers = async () => {
  try {
    loading.value = true;
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login to view users");
      return;
    }

    const endpoint = props.type === 'followers' ? 'followers' : 'following';
    const response = await axios.get(
      `http://localhost:3000/api/v1/user/${props.userId}/${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      users.value = response.data[props.type] || [];
    } else {
      toast.error(`Failed to load ${props.type}`);
    }
  } catch (error) {
    console.error(`Error fetching ${props.type}:`, error);
    toast.error(`Failed to load ${props.type}`);
  } finally {
    loading.value = false;
  }
};

// Check if current user is following a user
const isFollowing = (userId) => {
  if (!authStore.user?.following) return false;
  return authStore.user.following.some(followingUser =>
    (typeof followingUser === 'object' ? followingUser._id : followingUser) === userId
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

      // Update the auth store
      if (response.data.action === "follow") {
        if (!authStore.user.following) {
          authStore.user.following = [];
        }
        // Check if already following (handle both populated objects and IDs)
        const isAlreadyFollowingUser = authStore.user.following.some(followingUser =>
          (typeof followingUser === 'object' ? followingUser._id : followingUser) === userId
        );
        if (!isAlreadyFollowingUser) {
          authStore.user.following.push(userId);
        }
      } else {
        if (authStore.user.following) {
          authStore.user.following = authStore.user.following.filter(followingUser =>
            (typeof followingUser === 'object' ? followingUser._id : followingUser) !== userId
          );
        }
      }

      // Refresh current user data from backend to get accurate counts
      await authStore.refreshCurrentUser();

      // Update the user's follower count in the list
      const userIndex = users.value.findIndex(u => u._id === userId);
      if (userIndex !== -1) {
        if (response.data.action === "follow") {
          users.value[userIndex].followers = users.value[userIndex].followers || [];
          // Check if already in followers (handle both populated objects and IDs)
          const isAlreadyFollowing = users.value[userIndex].followers.some(follower =>
            (typeof follower === 'object' ? follower._id : follower) === authStore.user._id
          );
          if (!isAlreadyFollowing) {
            users.value[userIndex].followers.push(authStore.user);
          }
        } else {
          if (users.value[userIndex].followers) {
            users.value[userIndex].followers = users.value[userIndex].followers.filter(follower =>
              (typeof follower === 'object' ? follower._id : follower) !== authStore.user._id
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error following user:", error);
    toast.error("Failed to follow/unfollow user");
  } finally {
    followingUsers.value = followingUsers.value.filter(id => id !== userId);
  }
};

// Navigation
const goToProfile = (userId) => {
  if (userId) {
    router.push({ name: "Profile", params: { id: userId } });
    closeModal();
  }
};

// Close modal
const closeModal = () => {
  emit('close');
};
</script>

<style scoped></style>