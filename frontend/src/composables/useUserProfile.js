import { ref } from "vue";
import axios from "axios";
import { toast } from "vue3-toastify";
import { useAuthStore } from "../stores/auth";

export function useUserProfile() {
  const authStore = useAuthStore();
  const userProfile = ref(null);
  const userPosts = ref([]);
  const isLoading = ref(false);
  const isFollowing = ref(false);

  const setUserProfile = (profile) => {
    userProfile.value = profile;
  };

  const getUserProfile = async (userId) => {
    try {
      isLoading.value = true;
      const token = sessionStorage.getItem("token");

      if (!token) {
        toast.error("Please log in to view profiles");
        return null;
      }

      console.log("🟡 Fetching profile for user:", userId);

      const response = await axios.get(
        `http://localhost:3000/api/v1/user/${userId}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUserProfile(response.data.user);
        console.log(
          "🟢 Profile fetched successfully:",
          response.data.user.username
        );
        return response.data.user;
      } else {
        toast.error("Failed to load profile");
        return null;
      }
    } catch (error) {
      console.error(
        "🔴 Error fetching profile:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Failed to load profile");
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const getUserPosts = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        toast.error("Please log in to view posts");
        return [];
      }

      console.log("🟡 Fetching posts for user:", userId);

      const response = await axios.get(
        `http://localhost:3000/api/v1/post/userpost/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        userPosts.value = response.data.posts || [];
        console.log("🟢 Posts fetched:", userPosts.value.length, "posts");
        return response.data.posts || [];
      } else {
        userPosts.value = [];
        return [];
      }
    } catch (error) {
      console.error(
        "🔴 Error fetching posts:",
        error.response?.data || error.message
      );
      userPosts.value = [];
      return [];
    }
  };

  const followUser = async (userId) => {
    try {
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

        // Update the profile's follower count if this is the target user's profile
        if (userProfile.value && userProfile.value._id === userId) {
          if (response.data.action === "follow") {
            if (!userProfile.value.followers) userProfile.value.followers = [];
            // Add current user to followers if not already there (check if populated or just IDs)
            const isAlreadyFollowing = userProfile.value.followers.some(follower =>
              (typeof follower === 'object' ? follower._id : follower) === authStore.user._id
            );
            if (!isAlreadyFollowing) {
              userProfile.value.followers.push(authStore.user);
            }
          } else {
            // Remove current user from followers
            if (userProfile.value.followers) {
              userProfile.value.followers = userProfile.value.followers.filter(follower =>
                (typeof follower === 'object' ? follower._id : follower) !== authStore.user._id
              );
            }
          }
        }

        // Update current user's following list
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

        return response.data;
      }
    } catch (error) {
      console.error("🔴 Error following user:", error);
      toast.error("Failed to update follow status");
      throw error;
    }
  };

  return {
    userProfile,
    userPosts,
    isLoading,
    isFollowing,
    setUserProfile,
    getUserProfile,
    getUserPosts,
    followUser,
  };
}
