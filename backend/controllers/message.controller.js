import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const recieverId = req.params.id;
    const { textMessage: message } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recieverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recieverId],
      });
    }

    const newMessage = await Message.create({
      recieverId,
      senderId,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
      await Promise.all([conversation.save(), newMessage.save()]);
    }
    //socket implementation
    const recieverSocketId = getReceiverSocketId(recieverId);
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({
      message: "Message sent successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error sending message", error });
  }
};
export const getMessages = async (req, res) => {
  try {
    const senderId = req.id;
    const recieverId = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, recieverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(200).json({ message: [], success: true });
    }

    return res.status(200).json({
      message: conversation.messages || [],
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving messages", error });
  }
};
