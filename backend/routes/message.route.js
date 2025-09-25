import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getMessages,
  sendMessage,
  getConversations,
} from "../controllers/message.controller.js";

const router = express.Router();

router.route("/send/:id").post(isAuthenticated, sendMessage);
router.route("/all/:id").get(isAuthenticated, getMessages);
router.route("/conversations").get(isAuthenticated, getConversations);

export default router;
