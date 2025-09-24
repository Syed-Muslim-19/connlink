import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const token = ref(sessionStorage.getItem("token") || null);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  // Actions
  const login = async (credentials) => {
    console.log("🟡 Auth Store: Starting login with:", {
      email: credentials.email,
      password: "***",
    });
    isLoading.value = true;
    error.value = null;

    try {
      console.log(
        "🟡 Auth Store: Making API call to:",
        "http://localhost:3000/api/v1/user/login"
      );

      // API call to login
      const response = await fetch("http://localhost:3000/api/v1/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      console.log("🟡 Auth Store: Response status:", response.status);
      const data = await response.json();
      console.log("🟡 Auth Store: Response data:", data);

      if (response.ok && data.success) {
        console.log("🟢 Auth Store: Login successful, setting token and user");
        token.value = data.token;
        user.value = data.user;
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        console.log("🟢 Auth Store: Token set:", data.token);
        console.log("🟢 Auth Store: User set:", data.user);
        return { success: true, message: data.message };
      } else {
        console.log("🔴 Auth Store: Login failed:", data.message);
        error.value = data.message || "Login failed";
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error("🔴 Auth Store: Network error:", err);
      error.value = "Network error occurred";
      return { success: false, message: "Network error occurred" };
    } finally {
      isLoading.value = false;
      console.log("🟡 Auth Store: Login process finished");
    }
  };

  const signup = async (userData) => {
    isLoading.value = true;
    error.value = null;

    try {
      // API call to signup
      const response = await fetch(
        "http://localhost:3000/api/v1/user/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // DON'T automatically log in the user after signup
        // Just return success without setting tokens/user data
        return { success: true, message: data.message };
      } else {
        error.value = data.message || "Signup failed";
        return { success: false, message: data.message };
      }
    } catch (err) {
      error.value = "Network error occurred";
      return { success: false, message: "Network error occurred" };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    console.log("🔴 Auth Store: Logout function called");
    console.log(
      "🔴 Auth Store: Before logout - token:",
      !!token.value,
      "user:",
      !!user.value
    );

    token.value = null;
    user.value = null;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    console.log(
      "🔴 Auth Store: After logout - token:",
      !!token.value,
      "user:",
      !!user.value
    );
    console.log("🔴 Auth Store: SessionStorage cleared");
  };

  const initializeAuth = () => {
    console.log("🟡 Auth Store: Initializing auth...");
    const savedToken = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    console.log(
      "🟡 Auth Store: savedToken:",
      savedToken ? "exists" : "missing"
    );
    console.log("🟡 Auth Store: savedUser:", savedUser ? "exists" : "missing");

    if (savedToken && savedUser) {
      try {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
        console.log("🟢 Auth Store: Auth initialized successfully");
        console.log("🟢 Auth Store: isAuthenticated:", !!token.value);
        console.log(
          "🟢 Auth Store: user:",
          user.value?.username || "no username"
        );
        return true;
      } catch (error) {
        console.error("🔴 Auth Store: Error parsing saved user:", error);
        // Clear invalid data
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        token.value = null;
        user.value = null;
        return false;
      }
    } else {
      console.log("🟡 Auth Store: No saved auth data found");
      return false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const setAuthUser = (userData) => {
    user.value = userData;
    if (userData) {
      sessionStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.removeItem("user");
    }
  };

  const updateUserCounts = (followingCount, followersCount) => {
    console.log("⚠️ updateUserCounts is deprecated - use direct array manipulation instead");
  };

  const refreshCurrentUser = async () => {
    try {
      if (!token.value || !user.value) return;

      const response = await fetch(`http://localhost:3000/api/v1/user/${user.value._id}/profile`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token.value}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          user.value = data.user;
          sessionStorage.setItem("user", JSON.stringify(data.user));
          console.log("🟢 Current user data refreshed");
        }
      }
    } catch (error) {
      console.error("🔴 Error refreshing current user:", error);
    }
  };

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    currentUser,
    // Actions
    login,
    signup,
    logout,
    initializeAuth,
    clearError,
    setAuthUser,
    updateUserCounts,
    refreshCurrentUser,
  };
});
