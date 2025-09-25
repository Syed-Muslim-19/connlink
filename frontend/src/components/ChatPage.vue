<template>
  <div class="h-screen bg-white relative md:flex overflow-hidden">
    <!-- Left Sidebar - Users List (Full screen on mobile) -->
    <div
      :class="[
        'flex flex-col transition-all duration-300',
        // Mobile: Full screen when not in chat, hidden when in chat
        // Desktop: Fixed width sidebar, always visible unless chat is selected
        showMobileChat
          ? 'hidden md:flex md:w-80 md:border-r md:border-gray-200'
          : 'flex w-full h-full md:w-80 md:border-r md:border-gray-200',
      ]"
    >
      <!-- Current User Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div
            v-if="!currentUser.profilePicture"
            class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
          >
            <span class="text-white font-bold text-sm">
              {{ (currentUser.username || "U").charAt(0).toUpperCase() }}
            </span>
          </div>
          <img
            v-else
            :src="currentUser.profilePicture"
            :alt="currentUser.username"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 class="font-semibold text-gray-900 flex items-center">
              {{ currentUser.username }}
              <VerifiedBadge
                :isVerified="currentUser.isVerified"
                size="small"
              />
            </h2>
          </div>
        </div>
      </div>

      <!-- Messages Header -->
      <div class="px-4 py-3 border-b border-gray-200">
        <h3 class="font-semibold text-gray-900">Messages</h3>
        <p class="text-xs text-gray-500 mt-1">
          {{ onlineUsers.length }}
          {{ onlineUsers.length === 1 ? "user" : "users" }} online
        </p>
      </div>

      <!-- Search Bar -->
      <div class="px-4 py-3 border-b border-gray-200">
        <div class="relative">
          <input
            v-model="searchQuery"
            @input="searchUsers"
            type="text"
            placeholder="Search for users..."
            class="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <!-- Clear search button -->
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Search loading indicator -->
        <div v-if="isSearching" class="flex items-center justify-center mt-2">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"
          ></div>
          <span class="ml-2 text-xs text-gray-500">Searching...</span>
        </div>
      </div>

      <!-- Users List -->
      <div class="flex-1 overflow-hidden">
        <div v-if="isLoadingUsers" class="p-4 text-center">
          <div
            class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"
          ></div>
          <p class="text-gray-500 text-sm mt-2">Loading users...</p>
        </div>

        <!-- Search Results -->
        <div
          v-else-if="searchQuery && searchResults.length > 0"
          class="h-full space-y-1"
        >
          <div
            class="px-3 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50"
          >
            Search Results
          </div>
          <div
            v-for="user in searchResults"
            :key="user._id"
            @click="selectUser(user)"
            :class="[
              'flex items-center space-x-3 p-3 cursor-pointer transition-colors',
              selectedUser?._id === user._id
                ? 'bg-gray-100'
                : 'hover:bg-gray-50',
            ]"
          >
            <div>
              <div
                v-if="!user.profilePicture"
                class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white font-bold text-sm">
                  {{ (user.username || "U").charAt(0).toUpperCase() }}
                </span>
              </div>
              <img
                v-else
                :src="user.profilePicture"
                :alt="user.username"
                class="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate flex items-center">
                {{ user.username }}
                <VerifiedBadge :isVerified="user.isVerified" size="small" />
              </p>
              <p class="text-sm text-gray-500 truncate">
                {{ user.followers?.length || 0 }} followers
              </p>
            </div>
          </div>
        </div>

        <!-- No Search Results -->
        <div
          v-else-if="searchQuery && searchResults.length === 0 && !isSearching"
          class="p-4 text-center"
        >
          <p class="text-gray-500 text-sm">
            No users found for "{{ searchQuery }}"
          </p>
        </div>

        <!-- Default View: Conversations + Suggested Users -->
        <div v-else class="h-full space-y-1">
          <!-- Recent Conversations -->
          <div v-if="conversations.length > 0">
            <div
              class="px-3 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50"
            >
              Recent Chats
            </div>
            <div
              v-for="conversation in conversations"
              :key="conversation._id"
              @click="selectUser(conversation.participant)"
              :class="[
                'flex items-center space-x-3 p-3 cursor-pointer transition-colors border-b border-gray-100',
                selectedUser?._id === conversation.participant._id
                  ? 'bg-purple-50'
                  : 'hover:bg-gray-50',
              ]"
            >
              <div class="relative">
                <div
                  v-if="!conversation.participant.profilePicture"
                  class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-white font-bold text-sm">
                    {{
                      (conversation.participant.username || "U")
                        .charAt(0)
                        .toUpperCase()
                    }}
                  </span>
                </div>
                <img
                  v-else
                  :src="conversation.participant.profilePicture"
                  :alt="conversation.participant.username"
                  class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <!-- Online indicator -->
                <div
                  v-if="
                    chatStore.onlineUsers.includes(conversation.participant._id)
                  "
                  class="absolute -bottom-0 -right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate flex items-center">
                  {{ conversation.participant.username }}
                  <VerifiedBadge
                    :isVerified="conversation.participant.isVerified"
                    size="small"
                  />
                </p>
                <p class="text-sm text-gray-500 truncate">
                  {{
                    conversation.lastMessage
                      ? (conversation.lastMessage.senderId === currentUser._id
                          ? "You: "
                          : "") + conversation.lastMessage.message
                      : "No messages yet"
                  }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{
                    conversation.lastMessage
                      ? formatMessageTime(conversation.lastMessage.createdAt)
                      : ""
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Online Users from Suggested (only show if we have suggested users) -->
          <div v-if="onlineUsers.length > 0 && suggestedUsers.length > 0">
            <div
              class="px-3 py-2 text-xs font-semibold text-green-600 uppercase tracking-wider bg-green-50"
            >
              {{ conversations.length > 0 ? "Online Now" : "Online" }}
            </div>
            <div
              v-for="user in onlineUsers"
              :key="user._id"
              @click="selectUser(user)"
              :class="[
                'flex items-center space-x-3 p-3 cursor-pointer transition-colors',
                selectedUser?._id === user._id
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50',
              ]"
            >
              <div class="relative">
                <div
                  v-if="!user.profilePicture"
                  class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-white font-bold text-sm">
                    {{ (user.username || "U").charAt(0).toUpperCase() }}
                  </span>
                </div>
                <img
                  v-else
                  :src="user.profilePicture"
                  :alt="user.username"
                  class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <!-- Online indicator -->
                <div
                  class="absolute -bottom-0 -right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate flex items-center">
                  {{ user.username }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </p>
                <p class="text-sm text-green-600 truncate">Active now</p>
              </div>
            </div>
          </div>

          <!-- Offline Users -->
          <div v-if="offlineUsers.length > 0">
            <div
              class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 mt-2"
            >
              Suggested
            </div>
            <div
              v-for="user in offlineUsers"
              :key="user._id"
              @click="selectUser(user)"
              :class="[
                'flex items-center space-x-3 p-3 cursor-pointer transition-colors',
                selectedUser?._id === user._id
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50',
              ]"
            >
              <div class="relative">
                <div
                  v-if="!user.profilePicture"
                  class="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-white font-bold text-sm">
                    {{ (user.username || "U").charAt(0).toUpperCase() }}
                  </span>
                </div>
                <img
                  v-else
                  :src="user.profilePicture"
                  :alt="user.username"
                  class="w-12 h-12 rounded-full object-cover flex-shrink-0 opacity-75"
                />
                <!-- Offline indicator -->
                <div
                  class="absolute -bottom-0 -right-0 w-4 h-4 bg-gray-400 border-2 border-white rounded-full"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-700 truncate flex items-center">
                  {{ user.username }}
                  <VerifiedBadge :isVerified="user.isVerified" size="small" />
                </p>
                <p class="text-sm text-gray-500 truncate">Offline</p>
              </div>
            </div>
          </div>
        </div>

        <!-- No Users State - when no conversations, no online users, and no offline users -->
        <div
          v-if="
            conversations.length === 0 &&
            onlineUsers.length === 0 &&
            offlineUsers.length === 0
          "
          class="p-8 text-center"
        >
          <div class="mb-4">
            <div
              class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto"
            >
              <svg
                class="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <h3 class="text-sm font-medium text-gray-900 mb-1">
            No suggested users
          </h3>
          <p class="text-xs text-gray-500">
            We'll suggest people for you to connect with
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side - Chat Area -->
    <div
      :class="[
        'flex flex-col transition-all duration-300 bg-white',
        // Mobile: Full screen when chat is selected, completely hidden when not
        // Desktop: Takes remaining space (flex-1)
        showMobileChat && selectedUser
          ? 'w-full h-full absolute inset-0 z-50 md:relative md:flex-1 md:inset-auto md:z-auto'
          : selectedUser
          ? 'hidden md:flex md:flex-1'
          : 'hidden md:flex md:flex-1',
      ]"
    >
      <!-- No Chat Selected State (Desktop only) -->
      <div
        v-if="!selectedUser"
        class="flex-1 flex items-center justify-center hidden md:flex"
      >
        <div class="text-center">
          <div
            class="w-24 h-24 mx-auto mb-6 border-2 border-gray-300 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-light text-gray-800 mb-2">Your messages</h3>
          <p class="text-gray-600 text-sm">Send a message to start a chat.</p>
        </div>
      </div>

      <!-- Chat Selected State -->
      <div v-else class="flex-1 flex flex-col min-h-0">
        <!-- Chat Header -->
        <div class="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div class="flex items-center space-x-3">
            <!-- Back Button (Mobile Only) -->
            <button
              @click="goBackToUsers"
              class="p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <svg
                class="w-5 h-5 text-gray-600"
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

            <div
              v-if="!selectedUser.profilePicture"
              class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm">
                {{ (selectedUser.username || "U").charAt(0).toUpperCase() }}
              </span>
            </div>
            <img
              v-else
              :src="selectedUser.profilePicture"
              :alt="selectedUser.username"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 class="font-semibold text-gray-900 flex items-center">
                {{ selectedUser.username }}
                <VerifiedBadge
                  :isVerified="selectedUser.isVerified"
                  size="small"
                />
              </h3>
              <p class="text-sm text-gray-500">Active now</p>
            </div>
            <div class="flex-1"></div>
            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <button class="p-2 hover:bg-gray-100 rounded-full">
                <svg
                  class="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
              <button class="p-2 hover:bg-gray-100 rounded-full">
                <svg
                  class="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button class="p-2 hover:bg-gray-100 rounded-full">
                <svg
                  class="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Messages Container -->
        <div class="flex-1 bg-gray-50 overflow-hidden min-h-0">
          <Messages
            :selectedUser="selectedUser"
            :messages="messages"
            :isLoadingMessages="isLoadingMessages"
          />
        </div>

        <!-- Message Input -->
        <div class="p-4 bg-white border-t border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="flex-1 relative">
              <input
                v-model="textMessage"
                type="text"
                placeholder="Write message here..."
                class="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                @keydown.enter="sendMessageHandler"
              />
            </div>
            <button
              @click="sendMessageHandler"
              :disabled="!textMessage.trim()"
              class="p-2 text-blue-500 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useChatStore } from "../stores/chat.js";
import { useSocketStore } from "../stores/socket.js";
import Messages from "./Messages.vue";
import VerifiedBadge from "./VerifiedBadge.vue";
import axios from "axios";

// Route and stores
const route = useRoute();
const authStore = useAuthStore();
const chatStore = useChatStore();
const socketStore = useSocketStore();
const currentUser = computed(
  () => authStore.currentUser || authStore.user || {}
);

// Reactive state
const selectedUser = ref(null);
const suggestedUsers = ref([]);
const conversations = ref([]);
const isLoadingUsers = ref(false);
const isLoadingConversations = ref(false);
const textMessage = ref("");
const messages = ref([]);
const isLoadingMessages = ref(false);
const showMobileChat = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
const searchTimeout = ref(null);

// Computed property to show only online users from suggested users
const onlineUsers = computed(() => {
  return suggestedUsers.value.filter((user) =>
    chatStore.onlineUsers.includes(user._id)
  );
});

// Computed property to show offline users from suggested users
const offlineUsers = computed(() => {
  return suggestedUsers.value.filter(
    (user) => !chatStore.onlineUsers.includes(user._id)
  );
});

// Select user function
const selectUser = async (user) => {
  selectedUser.value = user;

  // Only set showMobileChat to true on mobile devices
  // On desktop, keep it false to show side-by-side view
  const isMobile = window.innerWidth < 768;
  showMobileChat.value = isMobile;

  console.log(
    "🟡 Selected user:",
    user.username,
    isMobile ? "(mobile full-screen)" : "(desktop side-by-side)"
  );

  // Store selected user in sessionStorage for persistence
  sessionStorage.setItem("selectedChatUser", JSON.stringify(user));

  // Fetch messages for this user
  await fetchMessages(user._id);
};

// Select user by ID (used when navigating from profile message button)
const selectUserById = async (userId) => {
  try {
    // First, check if user is in conversations
    const conversationUser = conversations.value.find(
      (conv) => conv.participant._id === userId
    );

    if (conversationUser) {
      await selectUser(conversationUser.participant);
      return;
    }

    // Then check if user is in suggested users
    const suggestedUser = suggestedUsers.value.find(
      (user) => user._id === userId
    );

    if (suggestedUser) {
      await selectUser(suggestedUser);
      return;
    }

    // If not found in conversations or suggested users, fetch user data from API
    const response = await axios.get(
      `http://localhost:3000/api/v1/user/${userId}/profile`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (response.data.success) {
      await selectUser(response.data.user);
      console.log(
        "✅ Selected user from profile navigation:",
        response.data.user.username
      );
    } else {
      console.error("🔴 User not found:", userId);
    }
  } catch (error) {
    console.error("🔴 Error selecting user by ID:", error);
  }
};

// Go back to users list (mobile)
const goBackToUsers = () => {
  showMobileChat.value = false;
  // Don't clear selectedUser to maintain context on mobile
};

// Reset chat state (for desktop navigation)
const resetChatState = () => {
  selectedUser.value = null;
  showMobileChat.value = false;
  messages.value = [];
  textMessage.value = "";
  sessionStorage.removeItem("selectedChatUser");
  console.log("🔄 Chat state reset");
};

// Send message function
const sendMessageHandler = async () => {
  if (!textMessage.value.trim() || !selectedUser.value) return;

  try {
    const response = await axios.post(
      `http://localhost:3000/api/v1/message/send/${selectedUser.value._id}`,
      {
        textMessage: textMessage.value,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (response.data.success) {
      // Add the new message to local messages array for immediate display
      const newMessage = {
        senderId: currentUser.value._id,
        recieverId: selectedUser.value._id,
        message: textMessage.value,
        createdAt: new Date().toISOString(),
      };

      messages.value.push(newMessage);
      textMessage.value = "";

      // Refresh conversations to update the conversation order and last message
      await fetchConversations();

      console.log("✅ Message sent successfully");
    }
  } catch (error) {
    console.error("🔴 Error sending message:", error);
  }
};

// Fetch messages for selected user
const fetchMessages = async (userId) => {
  if (!userId) return;

  try {
    isLoadingMessages.value = true;

    const response = await axios.get(
      `http://localhost:3000/api/v1/message/all/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (response.data.success) {
      messages.value = response.data.message || [];
      console.log("✅ Messages fetched:", messages.value.length);
    }
  } catch (error) {
    console.error("🔴 Error fetching messages:", error);
    messages.value = [];
  } finally {
    isLoadingMessages.value = false;
  }
};

// Fetch conversations
const fetchConversations = async () => {
  try {
    isLoadingConversations.value = true;

    const response = await axios.get(
      "http://localhost:3000/api/v1/message/conversations",
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (response.data.success) {
      conversations.value = response.data.conversations || [];
      console.log("💬 Conversations loaded:", conversations.value.length);
    }
  } catch (error) {
    console.error("🔴 Error fetching conversations:", error);
  } finally {
    isLoadingConversations.value = false;
  }
};

// Fetch suggested users
const fetchSuggestedUsers = async () => {
  try {
    isLoadingUsers.value = true;

    const response = await axios.get(
      "http://localhost:3000/api/v1/user/suggested",
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (response.data.success) {
      suggestedUsers.value = response.data.users || [];
      console.log("🟢 Suggested users loaded:", suggestedUsers.value.length);
    }
  } catch (error) {
    console.error("🔴 Error fetching suggested users:", error);
    toast.error("Failed to load users");
  } finally {
    isLoadingUsers.value = false;
  }
};

// Search users function
const searchUsers = async () => {
  // Clear previous search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // If search query is empty, clear results
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  // Debounce search to avoid too many API calls
  searchTimeout.value = setTimeout(async () => {
    try {
      isSearching.value = true;

      const response = await axios.get(
        `http://localhost:3000/api/v1/user/search?query=${encodeURIComponent(
          searchQuery.value.trim()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (response.data.success) {
        searchResults.value = response.data.users || [];
        console.log("🔍 Search results:", searchResults.value.length);
      }
    } catch (error) {
      console.error("🔴 Error searching users:", error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 500); // 500ms debounce
};

// Clear search function
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
};

// Format message time utility
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) return "now";

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d`;
  }

  // More than 7 days - show date
  return date.toLocaleDateString();
};

// Socket.io real-time message handling
const setupSocketListeners = () => {
  const socket = socketStore.getSocket();
  if (socket) {
    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      console.log("📨 Received new message:", newMessage);

      // Only add message if it's for the currently selected user
      if (
        selectedUser.value &&
        (newMessage.senderId === selectedUser.value._id ||
          newMessage.recieverId === selectedUser.value._id)
      ) {
        messages.value.push(newMessage);
      }

      // Refresh conversations to update the conversation order and last message
      fetchConversations();
    });

    // Listen for online users updates - refresh messages when users come online
    socket.on("getOnlineUsers", (onlineUserIds) => {
      console.log("👥 Online users updated:", onlineUserIds);

      // If selected user just came online, refresh their messages
      if (
        selectedUser.value &&
        onlineUserIds.includes(selectedUser.value._id)
      ) {
        console.log("🔄 Selected user came online, refreshing messages");
        fetchMessages(selectedUser.value._id);
      }
    });
  }
};

// Cleanup socket listeners
const cleanupSocketListeners = () => {
  const socket = socketStore.getSocket();
  if (socket) {
    socket.off("newMessage");
    socket.off("getOnlineUsers");
  }
};

// Restore selected user on refresh (only for direct navigation or refresh)
const restoreSelectedUser = async () => {
  const savedUser = sessionStorage.getItem("selectedChatUser");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      selectedUser.value = user;

      // On mobile, always show chat when restored
      // On desktop, show chat only if explicitly restored (e.g., page refresh)
      const isMobile = window.innerWidth < 768;
      showMobileChat.value = isMobile;

      console.log(
        "🔄 Restored selected user:",
        user.username,
        isMobile ? "(mobile)" : "(desktop)"
      );

      // Fetch messages for restored user
      await fetchMessages(user._id);
    } catch (error) {
      console.error("🔴 Error restoring selected user:", error);
      sessionStorage.removeItem("selectedChatUser");
    }
  }
};

// Watch for route changes to reset state (desktop only)
watch(
  () => route.path,
  (newPath, oldPath) => {
    // If navigating away from chat, reset the state
    if (oldPath === "/chat" && newPath !== "/chat") {
      console.log("🔄 Navigating away from chat, resetting state");
      resetChatState();
    }
    // If navigating TO chat from another route, ensure clean state
    if (newPath === "/chat" && oldPath !== "/chat") {
      console.log("🔄 Navigating to chat, ensuring clean state");
      // Don't reset completely, but ensure proper desktop default
      if (!selectedUser.value) {
        showMobileChat.value = false;
      }
    }
  }
);

// Initialize on mount
onMounted(async () => {
  console.log("🟡 ChatPage mounted");
  console.log("🟡 Current user:", currentUser.value);

  if (!currentUser.value._id) {
    console.error("🔴 Please log in to access chat");
    return;
  }

  // Fetch conversations first, then suggested users
  await fetchConversations();
  await fetchSuggestedUsers();

  // Check if userId is passed as query parameter (from Profile message button)
  if (route.query.userId) {
    await selectUserById(route.query.userId);
  } else if (route.path === "/chat") {
    // Only restore selected user if we're coming directly to /chat (e.g., refresh)
    // Don't restore if navigating from another route
    await restoreSelectedUser();
  }

  setupSocketListeners();
});

// Cleanup on unmount
onUnmounted(() => {
  cleanupSocketListeners();
  // Clean up search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  // Clean up when component unmounts
  resetChatState();
});
</script>

<style scoped>
/* Custom scrollbar for users list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Mobile full-screen transitions */
@media (max-width: 768px) {
  .transition-all {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Ensure mobile views take full height */
@media (max-width: 768px) {
  .h-full {
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile browsers */
  }
}
</style>
