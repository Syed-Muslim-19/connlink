import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePostStore = defineStore("posts", () => {
  // Initialize posts from cache if available
  const initializePosts = () => {
    try {
      const cachedPosts = localStorage.getItem("cached_posts");
      if (cachedPosts) {
        console.log("🟢 Posts Store: Loading cached posts on init");
        const parsedPosts = JSON.parse(cachedPosts);
        return parsedPosts;
      }
    } catch (e) {
      console.log("🔴 Posts Store: Failed to load cached posts:", e);
    }
    return [];
  };

  // State - initialize with cached posts
  const posts = ref(initializePosts());
  const currentPost = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const hasMore = ref(true);
  const page = ref(1);

  console.log(
    "🟢 Posts Store: Initialized with",
    posts.value.length,
    "cached posts"
  );

  // Getters
  const allPosts = computed(() => posts.value);
  const postsCount = computed(() => posts.value.length);

  // Actions
  const fetchPosts = async (pageNum = 1, reset = false) => {
    isLoading.value = true;
    error.value = null;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (reset || pageNum === 1) {
          posts.value = data.posts;
        } else {
          posts.value.push(...data.posts);
        }
        hasMore.value = data.hasMore;
        page.value = pageNum;
      } else {
        error.value = data.message || "Failed to fetch posts";
      }
    } catch (err) {
      error.value = "Network error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  const createPost = async (formData) => {
    console.log("🟡 Posts Store: Starting post creation");
    isLoading.value = true;
    error.value = null;

    try {
      console.log("🔍 Posts Store: Checking for token...");

      // Import auth store to get the current token
      const { useAuthStore } = await import('./auth.js');
      const authStore = useAuthStore();

      console.log("🔍 Posts Store: Auth store token:", authStore.token);
      console.log("🔍 Posts Store: Auth store isAuthenticated:", authStore.isAuthenticated);

      // Use token from auth store first, fallback to sessionStorage
      let token = authStore.token || sessionStorage.getItem("token");

      console.log("🔍 Posts Store: Final token to use:", token ? "YES" : "NO");
      console.log("🔍 Posts Store: sessionStorage keys:", Object.keys(sessionStorage));

      if (!token) {
        console.log("🔴 Posts Store: No token found anywhere");
        throw new Error("No authentication token found");
      }

      console.log("🟡 Posts Store: Making API call to create post");

      const response = await fetch(
        "http://localhost:3000/api/v1/post/addpost",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          credentials: "include",
          body: formData, // FormData object
        }
      );

      const data = await response.json();
      console.log("🟢 Posts Store: Post creation response:", data);

      if (response.ok && data.success) {
        posts.value.unshift(data.post); // Add new post to the beginning
        console.log("🟢 Posts Store: Post added to store:", data.post);

        // Update cache with new posts array
        try {
          localStorage.setItem("cached_posts", JSON.stringify(posts.value));
          console.log("🟢 Posts Store: Cache updated after new post creation");
        } catch (e) {
          console.log(
            "🟡 Posts Store: Failed to update cache after post creation:",
            e
          );
        }

        return { success: true, post: data.post, message: data.message };
      } else {
        error.value = data.message || "Failed to create post";
        return {
          success: false,
          message: data.message || "Failed to create post",
        };
      }
    } catch (err) {
      console.log("🔴 Posts Store: Error creating post:", err);
      const errorMessage = err.message || "Network error occurred";
      error.value = errorMessage;
      return { success: false, message: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  const likePost = async (postId) => {
    console.log("🔧 DEBUG: likePost called for postId:", postId);
    try {
      const token = sessionStorage.getItem("token");
      console.log("🔧 DEBUG: Making like request to API...");
      const response = await fetch(`/api/v1/post/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("🔧 DEBUG: Like API response:", data);

      if (response.ok) {
        // Update the post in the posts array
        const postIndex = posts.value.findIndex((post) => post._id === postId);
        if (postIndex !== -1) {
          posts.value[postIndex].isLiked = data.isLiked;
          posts.value[postIndex].likes = data.likes;

          // Update cache after like action
          try {
            localStorage.setItem("cached_posts", JSON.stringify(posts.value));
            console.log("🟢 Posts Store: Cache updated after like action");
          } catch (e) {
            console.log(
              "🟡 Posts Store: Failed to update cache after like:",
              e
            );
          }
        }
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const addComment = async (postId, commentText) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the post's comments in the posts array
        const postIndex = posts.value.findIndex((post) => post._id === postId);
        if (postIndex !== -1) {
          posts.value[postIndex].comments.push(data.comment);

          // Update cache after adding comment
          try {
            localStorage.setItem("cached_posts", JSON.stringify(posts.value));
            console.log("🟢 Posts Store: Cache updated after adding comment");
          } catch (e) {
            console.log(
              "🟡 Posts Store: Failed to update cache after comment:",
              e
            );
          }
        }
        return data.comment;
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const deletePost = async (postId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/v1/post/delete/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove post from the posts array
        posts.value = posts.value.filter((post) => post._id !== postId);

        // Update cache after deleting post
        try {
          localStorage.setItem("cached_posts", JSON.stringify(posts.value));
          console.log("🟢 Posts Store: Cache updated after deleting post");
        } catch (e) {
          console.log(
            "🟡 Posts Store: Failed to update cache after delete:",
            e
          );
        }
      } else {
        console.log("🔴 Posts Store: Failed to delete post:", data.message);
        throw new Error(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("🔴 Posts Store: Error deleting post:", err);
      throw err; // Re-throw so the component can handle the error
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore.value || isLoading.value) return;
    await fetchPosts(page.value + 1, false);
  };

  const refreshPosts = async () => {
    await fetchPosts(1, true);
  };

  const clearError = () => {
    error.value = null;
  };

  // Redux-like action to set posts directly
  const setPosts = (newPosts) => {
    console.log(
      "🟢 Posts Store: Setting posts - received:",
      newPosts?.length || 0,
      "posts"
    );
    console.log("🟢 Posts Store: First post:", newPosts?.[0] || "No posts");
    posts.value = newPosts || [];
    error.value = null;
    console.log(
      "🟢 Posts Store: Posts state after update:",
      posts.value.length
    );

    // Update cache whenever posts are set
    try {
      localStorage.setItem("cached_posts", JSON.stringify(posts.value));
      console.log(
        "🟢 Posts Store: Cache updated with",
        posts.value.length,
        "posts"
      );
    } catch (e) {
      console.log("🟡 Posts Store: Failed to update cache:", e);
    }
  };

  return {
    // State
    posts,
    currentPost,
    isLoading,
    error,
    hasMore,
    page,
    // Getters
    allPosts,
    postsCount,
    // Actions
    fetchPosts,
    createPost,
    likePost,
    addComment,
    deletePost,
    loadMorePosts,
    refreshPosts,
    clearError,
    setPosts, // Redux-like dispatcher
  };
});
