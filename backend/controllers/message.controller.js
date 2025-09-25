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

// Get all conversations for a user (like Instagram chat list)
export const getConversations = async (req, res) => {
  try {
    const userId = req.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username profilePicture isVerified",
        match: { _id: { $ne: userId } }, // Exclude current user from participants
      })
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 }, // Get only the latest message
      })
      .sort({ updatedAt: -1 }); // Sort conversations by most recent activity

    // Filter out conversations where participants is null (can happen with match filter)
    const validConversations = conversations.filter(
      (conv) => conv.participants.length > 0
    );

    // Format the response to make it easier for frontend
    const formattedConversations = validConversations.map((conversation) => {
      const otherParticipant = conversation.participants[0]; // Since we filtered current user
      const lastMessage = conversation.messages[0] || null;

      return {
        _id: conversation._id,
        participant: otherParticipant,
        lastMessage: lastMessage
          ? {
              _id: lastMessage._id,
              message: lastMessage.message,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        updatedAt: conversation.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    return res.status(500).json({
      message: "Error retrieving conversations",
      success: false,
    });
  }
};
