import { useAuthStore } from "../stores/auth";
import { usePostStore } from "../stores/posts";
import { useUserStore } from "../stores/user";

// Auth composable
export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    // State
    user: authStore.user,
    token: authStore.token,
    isLoading: authStore.isLoading,
    error: authStore.error,

    // Getters
    isAuthenticated: authStore.isAuthenticated,
    currentUser: authStore.currentUser,

    // Actions
    login: authStore.login,
    signup: authStore.signup,
    logout: authStore.logout,
    initializeAuth: authStore.initializeAuth,
    clearError: authStore.clearError,
  };
};

// Posts composable
export const usePosts = () => {
  const postStore = usePostStore();

  return {
    // State
    posts: postStore.posts,
    currentPost: postStore.currentPost,
    isLoading: postStore.isLoading,
    error: postStore.error,
    hasMore: postStore.hasMore,
    page: postStore.page,

    // Getters
    allPosts: postStore.allPosts,
    postsCount: postStore.postsCount,

    // Actions
    fetchPosts: postStore.fetchPosts,
    createPost: postStore.createPost,
    likePost: postStore.likePost,
    addComment: postStore.addComment,
    deletePost: postStore.deletePost,
    loadMorePosts: postStore.loadMorePosts,
    refreshPosts: postStore.refreshPosts,
    clearError: postStore.clearError,
  };
};

// User composable
export const useUser = () => {
  const userStore = useUserStore();

  return {
    // State
    userProfile: userStore.userProfile,
    followers: userStore.followers,
    following: userStore.following,
    isLoading: userStore.isLoading,
    error: userStore.error,

    // Getters
    profile: userStore.profile,
    followersCount: userStore.followersCount,
    followingCount: userStore.followingCount,

    // Actions
    fetchUserProfile: userStore.fetchUserProfile,
    updateProfile: userStore.updateProfile,
    followUser: userStore.followUser,
    fetchFollowers: userStore.fetchFollowers,
    fetchFollowing: userStore.fetchFollowing,
    searchUsers: userStore.searchUsers,
    clearError: userStore.clearError,
  };
};
