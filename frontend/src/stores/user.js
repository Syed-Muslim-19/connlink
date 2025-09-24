import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  // State
  const userProfile = ref(null);
  const followers = ref([]);
  const following = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const profile = computed(() => userProfile.value);
  const followersCount = computed(() => followers.value.length);
  const followingCount = computed(() => following.value.length);

  // Actions
  const fetchUserProfile = async (userId) => {
    isLoading.value = true;
    error.value = null;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        userProfile.value = data.user;
      } else {
        error.value = data.message || "Failed to fetch user profile";
      }
    } catch (err) {
      error.value = "Network error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  const updateProfile = async (profileData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        userProfile.value = { ...userProfile.value, ...data.user };
        // Update localStorage user data
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...savedUser, ...data.user })
        );
        return data.user;
      } else {
        error.value = data.message || "Failed to update profile";
        return null;
      }
    } catch (err) {
      error.value = "Network error occurred";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const followUser = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Update following list
        if (data.isFollowing) {
          following.value.push({ _id: userId });
        } else {
          following.value = following.value.filter(
            (user) => user._id !== userId
          );
        }
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  const fetchFollowers = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/followers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        followers.value = data.followers;
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
    }
  };

  const fetchFollowing = async (userId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/following`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        following.value = data.following;
      }
    } catch (err) {
      console.error("Error fetching following:", err);
    }
  };

  const searchUsers = async (query) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data.users;
      }
      return [];
    } catch (err) {
      console.error("Error searching users:", err);
      return [];
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    userProfile,
    followers,
    following,
    isLoading,
    error,
    // Getters
    profile,
    followersCount,
    followingCount,
    // Actions
    fetchUserProfile,
    updateProfile,
    followUser,
    fetchFollowers,
    fetchFollowing,
    searchUsers,
    clearError,
  };
});
