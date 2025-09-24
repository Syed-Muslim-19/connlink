import { defineStore } from "pinia";
import { ref } from "vue";

export const useChatStore = defineStore("chat", () => {
  // State
  const onlineUsers = ref([]);
  const messages = ref([]);
  const selectedConversation = ref(null);

  // Actions
  const setOnlineUsers = (users) => {
    onlineUsers.value = users;
    console.log("🟢 Online users updated:", users.length);
  };

  const addOnlineUser = (userId) => {
    if (!onlineUsers.value.includes(userId)) {
      onlineUsers.value.push(userId);
      console.log("🟢 User came online:", userId);
    }
  };

  const removeOnlineUser = (userId) => {
    onlineUsers.value = onlineUsers.value.filter((id) => id !== userId);
    console.log("🔴 User went offline:", userId);
  };

  const addMessage = (message) => {
    messages.value.push(message);
    console.log("🟢 New message added:", message);
  };

  const setMessages = (messageList) => {
    messages.value = messageList;
    console.log("🟢 Messages set:", messageList.length);
  };

  const setSelectedConversation = (conversation) => {
    selectedConversation.value = conversation;
    console.log("🟢 Selected conversation:", conversation?._id);
  };

  const clearChat = () => {
    onlineUsers.value = [];
    messages.value = [];
    selectedConversation.value = null;
    console.log("🔄 Chat store cleared");
  };

  // Getters
  const isUserOnline = (userId) => {
    return onlineUsers.value.includes(userId);
  };

  return {
    // State
    onlineUsers,
    messages,
    selectedConversation,
    // Actions
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    addMessage,
    setMessages,
    setSelectedConversation,
    clearChat,
    // Getters
    isUserOnline,
  };
});
