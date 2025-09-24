import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});
const userSocketMap = {}; // userId -> socketId
export const getReceiverSocketId = (receiverId) => {
  const socketId = userSocketMap[receiverId];
  console.log("🔍 Getting socket ID for user:", receiverId, "->", socketId);
  console.log("🔍 Current userSocketMap:", userSocketMap);
  return socketId;
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  const tabId = socket.handshake.query.tabId;

  console.log("🔧 SOCKET DEBUG: New connection attempt");
  console.log("- Socket ID:", socket.id);
  console.log("- User ID:", userId);
  console.log("- Tab ID:", tabId);
  console.log("- Current userSocketMap:", userSocketMap);

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("✅ User connected and mapped:", userId, "->", socket.id);
  } else {
    console.log("❌ No userId provided in connection");
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    if (userId) {
      console.log("User disconnected:", userId);
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
export { app, server, io };
