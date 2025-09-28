import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.js";
import MainLayout from "./components/MainLayout.vue";
import Home from "./components/Home.vue";
import Search from "./components/Search.vue";
import Explore from "./components/Explore.vue";
import Messages from "./components/Messages.vue";
import Notifications from "./components/Notifications.vue";
import Create from "./components/Create.vue";
import CreatePost from "./components/CreatePost.vue";
import Posts from "./components/Posts.vue";
import Profile from "./components/Profile.vue";
import EditProfile from "./components/EditProfile.vue";
import ChatPage from "./components/ChatPage.vue";
import Login from "./components/Login.vue";
import Signup from "./components/Signup.vue";
import SubscriptionSuccess from "./components/SubscriptionSuccess.vue";
import SubscriptionCancel from "./components/SubscriptionCancel.vue";

const routes = [
  // Authentication routes (no sidebar)
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  // Subscription routes (no sidebar)
  {
    path: "/subscription/success",
    name: "SubscriptionSuccess",
    component: SubscriptionSuccess,
  },
  {
    path: "/subscription/cancel",
    name: "SubscriptionCancel",
    component: SubscriptionCancel,
  },
  // Main layout with nested routes (with sidebar)
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "Home",
        component: Home,
      },
      {
        path: "search",
        name: "Search",
        component: Search,
      },
      {
        path: "explore",
        name: "Explore",
        component: Explore,
      },
      {
        path: "messages",
        name: "Messages",
        component: Messages,
      },
      {
        path: "notifications",
        name: "Notifications",
        component: Notifications,
      },
      {
        path: "create",
        name: "Create",
        component: Create,
      },
      {
        path: "create-post",
        name: "CreatePost",
        component: CreatePost,
      },
      {
        path: "posts",
        name: "Posts",
        component: Posts,
      },
      {
        path: "profile/:id",
        name: "Profile",
        component: Profile,
      },
      {
        path: "account/edit",
        name: "EditProfile",
        component: EditProfile,
      },
      {
        path: "chat",
        name: "ChatPage",
        component: ChatPage,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route guard to protect authenticated routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const publicRoutes = [
    "/login",
    "/signup",
    "/subscription/success",
    "/subscription/cancel",
  ];
  const requiresAuth = !publicRoutes.includes(to.path);

  // Check if token exists in sessionStorage as fallback
  const tokenExists = sessionStorage.getItem("token");
  const userExists = sessionStorage.getItem("user");

  console.log("🔒 Router Guard:", {
    to: to.path,
    from: from.path,
    requiresAuth,
    storeAuth: authStore.isAuthenticated,
    storeToken: !!authStore.token,
    sessionToken: !!tokenExists,
    sessionUser: !!userExists,
  });

  // Special handling for logout navigation - if going to login and no tokens exist, allow it
  if (to.path === "/login" && !tokenExists && !authStore.token) {
    console.log("🔓 Allowing logout navigation to login");
    next();
    return;
  }

  // If we have token in sessionStorage but not in store, restore it
  if (tokenExists && !authStore.token) {
    console.log("🔧 Restoring token from sessionStorage");
    authStore.token = tokenExists;
    if (userExists) {
      try {
        authStore.user = JSON.parse(userExists);
      } catch (e) {
        console.error("Error parsing user from sessionStorage:", e);
      }
    }
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    // User is not authenticated, redirect to login
    console.log("🚫 Redirecting to login - not authenticated");
    next("/login");
  } else if (
    (to.path === "/login" || to.path === "/signup") &&
    authStore.isAuthenticated
  ) {
    // User is already authenticated, redirect to home
    console.log("✅ Redirecting to home - already authenticated");
    next("/");
  } else {
    // Allow navigation
    console.log("✅ Allowing navigation to:", to.path);
    next();
  }
});

export default router;
