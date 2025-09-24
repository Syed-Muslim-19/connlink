// Authentication utility functions

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("authToken", token);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  console.log("Checking authentication - token:", token);
  
  // Check if token exists and is not empty
  if (!token || token === "" || token === "null" || token === "undefined") {
    console.log("No valid token found");
    return false;
  }
  
  console.log("Valid token found, user is authenticated");
  return true;
};

export const logout = () => {
  // Clear all authentication data
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
  
  // Clear any other app-specific data
  localStorage.removeItem("preferences");
  localStorage.removeItem("cache");
};

export const preventBackNavigation = () => {
  // Prevent back button navigation to protected pages after logout
  window.history.pushState(null, null, window.location.pathname);
  
  window.addEventListener("popstate", function(event) {
    if (!isAuthenticated() && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
      window.history.pushState(null, null, "/login");
      window.location.replace("/login");
    }
  });
};
