import { defineStore } from "pinia";
import { ref } from "vue";

export const useSocketStore = defineStore("socket", () => {
  // State
  const socket = ref(null);
  const isConnected = ref(false);

  // Actions
  const setSocket = (socketInstance) => {
    socket.value = socketInstance;
    isConnected.value = !!socketInstance;
  };

  const clearSocket = () => {
    if (socket.value) {
      socket.value.close();
    }
    socket.value = null;
    isConnected.value = false;
  };

  const getSocket = () => {
    return socket.value;
  };

  return {
    // State
    socket,
    isConnected,
    // Actions
    setSocket,
    clearSocket,
    getSocket,
  };
});
