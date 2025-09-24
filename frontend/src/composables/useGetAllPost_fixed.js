import { ref, onMounted } from "vue";
import { usePostStore } from "../stores/posts.js";
import axios from "axios";
import { toast } from "vue3-toastify";

export const useGetAllPost = () => {
  const postStore = usePostStore();
  const isLoading = ref(false);
  const error = ref(null);

  const fetchAllPosts = async () => {
    console.log("🟡 useGetAllPost: Starting to fetch all posts");
    isLoading.value = true;
    error.value = null;

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      console.log(
        "🟡 Token found:",
        token ? "Yes" : "No",
        token ? token.substring(0, 20) + "..." : ""
      );
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("🟡 useGetAllPost: Making API call to fetch all posts");

      const response = await axios.get(
        "http://localhost:3000/api/v1/post/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("🟢 useGetAllPost: API Response:", response.data);
      console.log(
        "🟢 useGetAllPost: Posts received:",
        response.data.posts?.length || 0
      );
      console.log(
        "🟢 useGetAllPost: First post:",
        response.data.posts?.[0] || "No posts"
      );

      if (response.data.success) {
        // Dispatch to store (like React Redux)
        postStore.setPosts(response.data.posts);
        console.log(
          "🟢 useGetAllPost: Posts dispatched to store:",
          response.data.posts?.length || 0
        );
        console.log(
          "🟢 useGetAllPost: Store state after dispatch:",
          postStore.allPosts.length
        );

        return {
          success: true,
          posts: response.data.posts,
          message: "Posts fetched successfully",
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch posts");
      }
    } catch (err) {
      console.log("🔴 useGetAllPost: Error fetching posts:", err);

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch posts";
      error.value = errorMessage;

      // Show error toast
      toast.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-fetch on mount (optional)
  const initializePosts = async () => {
    console.log("🟡 useGetAllPost: Initializing posts...");
    await fetchAllPosts();
  };

  // Refresh posts
  const refreshPosts = async () => {
    console.log("🟡 useGetAllPost: Refreshing posts...");
    await fetchAllPosts();
  };

  return {
    // State
    isLoading,
    error,

    // Actions
    fetchAllPosts,
    initializePosts,
    refreshPosts,

    // Store getters (for convenience)
    posts: postStore.allPosts,
    postsCount: postStore.postsCount,
  };
};
