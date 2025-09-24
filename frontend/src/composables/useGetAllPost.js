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
    console.log(
      "🟡 useGetAllPost: Current store posts:",
      postStore.allPosts.length
    );
    console.log(
      "🟡 useGetAllPost: Current localStorage token:",
      sessionStorage.getItem("token") ? "exists" : "missing"
    );
    console.log(
      "🟡 useGetAllPost: Current localStorage user:",
      sessionStorage.getItem("user") ? "exists" : "missing"
    );

    // FORCE FETCH - temporarily disable smart caching
    console.log("� useGetAllPost: FORCE FETCHING - ignoring store posts");

    isLoading.value = true;
    error.value = null;

    try {
      // Get token from localStorage
      const token = sessionStorage.getItem("token");
      console.log(
        "🟡 Token found:",
        token ? "Yes" : "No",
        token ? token.substring(0, 20) + "..." : ""
      );
      if (!token) {
        // Try to load cached posts if no token
        const cachedPosts = localStorage.getItem("cached_posts");
        if (cachedPosts) {
          console.log("🟡 No token, loading cached posts");
          const posts = JSON.parse(cachedPosts);
          postStore.setPosts(posts);
          return { success: true, posts, message: "Loaded cached posts" };
        }
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
        console.log(
          "🟡 About to dispatch to store:",
          response.data.posts?.length || 0,
          "posts"
        );
        console.log(
          "🟡 Posts data type:",
          typeof response.data.posts,
          Array.isArray(response.data.posts)
        );

        // Cache posts in localStorage for persistence
        try {
          localStorage.setItem(
            "cached_posts",
            JSON.stringify(response.data.posts)
          );
          console.log("🟢 Posts cached to localStorage");
        } catch (e) {
          console.log("🟡 Failed to cache posts:", e);
        }

        postStore.setPosts(response.data.posts);
        console.log(
          "🟢 useGetAllPost: Posts dispatched to store:",
          response.data.posts?.length || 0
        );
        console.log(
          "🟢 useGetAllPost: Store state after dispatch:",
          postStore.allPosts.length
        );
        console.log("🟢 Store posts array:", postStore.allPosts);

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

      // Try to load cached posts as fallback
      const cachedPosts = localStorage.getItem("cached_posts");
      if (cachedPosts) {
        try {
          console.log("🟡 API failed, loading cached posts as fallback");
          const posts = JSON.parse(cachedPosts);
          postStore.setPosts(posts);
          error.value = null; // Clear error since we have cached data
          return {
            success: true,
            posts,
            message: "Loaded cached posts (offline)",
          };
        } catch (parseError) {
          console.log("🔴 Failed to parse cached posts:", parseError);
        }
      }

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
