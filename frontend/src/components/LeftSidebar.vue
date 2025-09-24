<script setup>
import { useRouter } from "vue-router";
import { ref, computed, watch, nextTick } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { useNotificationStore } from "../stores/notification.js";

const router = useRouter();

// Use Pinia stores directly
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Create user object from logged in user - directly reference the store
const user = computed(() => authStore.currentUser);
const currentUser = computed(() => authStore.currentUser);

// Profile route - use actual user ID or fallback to 'me'
const profileRoute = computed(() => {
  const route = currentUser.value?._id
    ? `/profile/${currentUser.value._id}`
    : "/profile/me";
  console.log(
    "🔍 LeftSidebar: profileRoute computed:",
    route,
    "userId:",
    currentUser.value?._id
  );
  return route;
});

// Watch for changes in currentUser to debug
watch(
  () => authStore.currentUser,
  (newUser) => {
    console.log("🔍 LeftSidebar: currentUser changed:", newUser);
  },
  { immediate: true }
);

// Debug: Log user data to console
console.log("🔍 LeftSidebar Debug:");
console.log("authStore:", authStore);
console.log("currentUser:", authStore.currentUser);
console.log("user object:", user.value);
console.log("isAuthenticated:", authStore.isAuthenticated);

// Get notification count from store - show red badge only for new notifications
const notificationCount = computed(() => {
  return notificationStore.hasUnreadNotifications
    ? notificationStore.getUnreadCount
    : 0;
});

// Mobile menu state
const showMobileMenu = ref(false);

// Sidebar collapse state
const isCollapsed = ref(false);

// Compute user display name and username from user object
const displayName = computed(() => {
  console.log("🔍 displayName computed - user.value:", user.value);
  return user.value?.username || "User";
});

const displayUsername = computed(() => {
  return user.value?.username ? `@${user.value.username}` : "@user";
});

// Get first letter for avatar from user object
const userInitial = computed(() => {
  return user.value?.username?.charAt(0).toUpperCase() || "U";
});

const handleLogout = async () => {
  console.log("🔴 Logout clicked - starting logout process");

  // Clear authentication data using Pinia store
  authStore.logout();
  console.log("🔴 Auth store logout called");
  console.log("🔴 Token after logout:", authStore.token);
  console.log("🔴 User after logout:", authStore.user);
  console.log("🔴 IsAuthenticated after logout:", authStore.isAuthenticated);

  // Close mobile menu
  showMobileMenu.value = false;

  // Wait a bit to ensure sessionStorage is cleared and state is updated
  await nextTick();

  // Use replace instead of push to prevent going back
  console.log("🔴 Navigating to login page");

  // Force navigation by using window.location as fallback
  try {
    await router.replace("/login");
    console.log("🔴 Router navigation completed");
  } catch (error) {
    console.error("🔴 Router navigation failed:", error);
    console.log("🔴 Using window.location fallback");
    window.location.href = "/login";
  }
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <!-- Desktop Sidebar -->
  <div
    class="hidden md:block relative h-screen transition-all duration-300"
    :class="isCollapsed ? 'w-24' : 'w-64'"
  >
    <!-- Collapse/Expand Button - Matching Parent UI Style -->
    <button
      @click="toggleSidebar"
      class="absolute -right-6 top-8 z-10 p-2 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
      style="
        background-color: #277cf7;
        border-radius: 0 8px 8px 0;
        border-left: none;
      "
    >
      <svg
        class="w-4 h-4 transition-transform duration-300"
        :class="isCollapsed ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
    <!-- Background with gradient like Login/Signup -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500"
    >
      <!-- Background decorations -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-white/10 backdrop-blur-3xl"
        ></div>
        <div
          class="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-pink-500/10 backdrop-blur-3xl"
        ></div>
        <div
          class="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full bg-yellow-400/5 backdrop-blur-3xl"
        ></div>
      </div>
    </div>

    <!-- Sidebar content with glass-morphism -->
    <div
      class="relative h-full bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col"
    >
      <!-- Logo/Brand -->
      <div class="p-6 border-b border-white/20">
        <div class="flex items-center justify-center">
          <div class="flex items-center justify-center">
            <div
              class="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center"
              :class="isCollapsed ? '' : 'mr-3'"
            >
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h1 v-if="!isCollapsed" class="text-xl font-bold text-white">
              ConnLink
            </h1>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-4 py-6 overflow-y-auto">
        <div class="space-y-2">
          <!-- Home -->
          <router-link
            to="/"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Home</span>
          </router-link>

          <!-- Search -->
          <router-link
            to="/search"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Search</span>
          </router-link>

          <!-- Explore -->
          <router-link
            to="/explore"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Explore</span>
          </router-link>

          <!-- Messages -->
          <router-link
            to="/chat"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Messages</span>
          </router-link>

          <!-- Notifications -->
          <router-link
            to="/notifications"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="flex items-center relative">
              <svg
                class="group-hover:text-white transition-all duration-300"
                :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-5 5v-5z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 3h16a2 2 0 012 2v6a2 2 0 01-2 2H6l-4 4V5a2 2 0 012-2z"
                ></path>
              </svg>
              <!-- Notification badge - adjusted for collapsed state -->
              <span
                v-if="notificationCount > 0"
                class="bg-red-500 text-white text-xs rounded-full text-center font-medium backdrop-blur-sm"
                :class="
                  isCollapsed
                    ? 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px]'
                    : 'ml-auto px-2 py-1 min-w-[20px]'
                "
                >{{
                  isCollapsed
                    ? notificationCount > 9
                      ? "9+"
                      : notificationCount
                    : notificationCount
                }}</span
              >
            </div>
            <span v-if="!isCollapsed" class="flex-1">Notifications</span>
          </router-link>

          <!-- Create -->
          <router-link
            to="/create"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Create</span>
          </router-link>

          <!-- Profile -->
          <router-link
            :to="profileRoute"
            class="flex items-center text-white/80 rounded-xl hover:bg-white/20 transition-all duration-300 group"
            :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <svg
              class="group-hover:text-white transition-all duration-300"
              :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            <span v-if="!isCollapsed">Profile</span>
          </router-link>
        </div>
      </nav>

      <!-- User Info and Logout -->
      <div class="border-t border-white/20 p-4">
        <!-- User Profile Section -->
        <div
          class="flex items-center mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm"
          :class="isCollapsed ? 'justify-center' : ''"
        >
          <div
            class="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center"
          >
            <span class="text-white font-semibold">{{ userInitial }}</span>
          </div>
          <div v-if="!isCollapsed" class="ml-3 flex-1">
            <p class="text-sm font-semibold text-white">{{ displayName }}</p>
            <p class="text-xs text-white/60">{{ displayUsername }}</p>
          </div>
        </div>
        <!-- Logout Button -->
        <button
          @click="handleLogout"
          class="w-full flex items-center text-white/80 rounded-xl hover:bg-red-500/20 hover:text-white transition-all duration-300 group"
          :class="isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'"
        >
          <svg
            class="group-hover:text-red-300 transition-all duration-300"
            :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-4'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          <span v-if="!isCollapsed">Logout</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Bottom Navigation -->
  <div class="md:hidden fixed bottom-0 left-0 right-0 z-50">
    <!-- Background with gradient -->
    <div
      class="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"
    >
      <!-- Background decorations -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-3xl"
        ></div>
        <div
          class="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-pink-500/10 backdrop-blur-3xl"
        ></div>
      </div>

      <!-- Bottom nav content -->
      <div
        class="relative bg-white/10 backdrop-blur-xl border-t border-white/20 px-4 py-3"
      >
        <nav class="flex justify-around items-center">
          <!-- Home -->
          <router-link
            to="/"
            class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="relative">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
            </div>
          </router-link>

          <!-- Search -->
          <router-link
            to="/search"
            class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="relative">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </router-link>

          <!-- Create -->
          <router-link
            to="/create"
            class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="relative">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </div>
          </router-link>

          <!-- Messages -->
          <router-link
            to="/chat"
            class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="relative">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
            </div>
          </router-link>

          <!-- Profile -->
          <router-link
            :to="profileRoute"
            class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            exact-active-class="bg-white/20 text-white font-semibold backdrop-blur-sm"
          >
            <div class="relative">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
          </router-link>

          <!-- Menu Button (Profile Avatar with dropdown) -->
          <div class="relative">
            <button
              @click="toggleMobileMenu"
              class="flex flex-col items-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
              :class="{
                'bg-white/20 text-white font-semibold backdrop-blur-sm':
                  showMobileMenu,
              }"
            >
              <div class="relative">
                <!-- Use user avatar for menu -->
                <div
                  class="w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <span class="text-white text-xs font-semibold">{{
                    userInitial
                  }}</span>
                </div>
                <!-- Notification badge on menu button -->
                <span
                  v-if="notificationCount > 0"
                  class="absolute -top-1 -right-1 bg-pink-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                  >{{ notificationCount > 9 ? "9+" : notificationCount }}</span
                >
              </div>
            </button>

            <!-- Mobile Dropdown Menu -->
            <div
              v-if="showMobileMenu"
              class="absolute bottom-full right-0 mb-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg"
            >
              <!-- User Info -->
              <div class="p-4 border-b border-white/20">
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center"
                  >
                    <span class="text-white font-semibold">{{
                      userInitial
                    }}</span>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-semibold text-white">
                      {{ displayName }}
                    </p>
                    <p class="text-xs text-white/60">{{ displayUsername }}</p>
                  </div>
                </div>
              </div>

              <!-- Menu Items -->
              <div class="p-2">
                <router-link
                  to="/notifications"
                  @click="showMobileMenu = false"
                  class="flex items-center px-3 py-2 text-white/80 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <div class="relative">
                    <svg
                      class="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 17h5l-5 5v-5z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 3h16a2 2 0 012 2v6a2 2 0 01-2 2H6l-4 4V5a2 2 0 012-2z"
                      ></path>
                    </svg>
                  </div>
                  <span class="text-sm">Notifications</span>
                  <span
                    v-if="notificationCount > 0"
                    class="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium"
                    >{{ notificationCount }}</span
                  >
                </router-link>

                <router-link
                  to="/explore"
                  @click="showMobileMenu = false"
                  class="flex items-center px-3 py-2 text-white/80 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <svg
                    class="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span class="text-sm">Explore</span>
                </router-link>

                <button
                  @click="handleLogout"
                  class="w-full flex items-center px-3 py-2 text-white/80 rounded-lg hover:bg-red-500/20 hover:text-white transition-all duration-300"
                >
                  <svg
                    class="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  <span class="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </div>

  <!-- Mobile Menu Overlay (click to close) -->
  <div
    v-if="showMobileMenu"
    @click="showMobileMenu = false"
    class="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
  ></div>
</template>

<style scoped>
/* Custom scrollbar if content overflows */
nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
