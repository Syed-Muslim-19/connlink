import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { createNotification } from "./notification.controller.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!authorId) {
      return res
        .status(400)
        .json({ message: "User not authenticated properly" });
    }

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({
        fit: "inside",
        width: 800,
        height: 800,
      })
      .toFormat("jpeg", {
        quality: 80,
      })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res
      .status(201)
      .json({ message: "Post created successfully", post, success: true });
  } catch (error) {
    return res.status(500).json({ message: "Error creating post", error });
  }
};

// Home Feed - Posts from users you follow
export const getHomeFeed = async (req, res) => {
  try {
    const currentUserId = req.id;

    // Get current user with following list
    const currentUser = await User.findById(currentUserId).select("following");
    if (!currentUser) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Get posts from users the current user is following (including their own posts)
    const followingUserIds = [...currentUser.following, currentUserId];

    const posts = await Post.find({ author: { $in: followingUserIds } })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture isVerified" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture isVerified" },
      });

    return res.status(200).json({
      message: "Home feed retrieved successfully",
      posts,
      success: true,
      feedType: "home"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error retrieving home feed", error });
  }
};

// Explore Feed - Posts from all users (discovery)
export const getExploreFeed = async (req, res) => {
  try {
    const currentUserId = req.id;

    // Get current user with following list
    const currentUser = await User.findById(currentUserId).select("following");
    if (!currentUser) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Get posts from users NOT followed by current user (excluding their own posts)
    const followingUserIds = [...currentUser.following, currentUserId];

    const posts = await Post.find({ author: { $nin: followingUserIds } })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture isVerified" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture isVerified" },
      });

    return res.status(200).json({
      message: "Explore feed retrieved successfully",
      posts,
      success: true,
      feedType: "explore"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error retrieving explore feed", error });
  }
};

// Legacy: Get all posts (keeping for backward compatibility)
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture isVerified" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture isVerified" },
      });

    return res
      .status(200)
      .json({ message: "Posts retrieved successfully", posts, success: true });
  } catch (error) {
    console.error("🔴 Error in getAllPost:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving posts", error: error.message });
  }
};
export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture isVerified" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture isVerified" },
      });

    return res.status(200).json({
      message: "User posts retrieved successfully",
      posts,
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving user posts", error });
  }
};

export const getUserPostById = async (req, res) => {
  try {
    const userId = req.params.id;
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture isVerified" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture isVerified" },
      });

    return res.status(200).json({
      message: "User posts retrieved successfully",
      posts,
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving user posts", error });
  }
};

export const likePost = async (req, res) => {
  try {
    const likeKarneWalaUserkiId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    await post.updateOne({ $addToSet: { likes: likeKarneWalaUserkiId } });

    const user = await User.findById(likeKarneWalaUserkiId).select(
      "username profilePicture"
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== likeKarneWalaUserkiId) {
      // Create notification in database
      const notification = await createNotification({
        recipient: postOwnerId,
        sender: likeKarneWalaUserkiId,
        type: "like",
        post: postId,
        message: `${user.username} liked your post`,
      });

      if (notification) {
        // Send real-time notification if user is online
        const postOwnerSocketId = getReceiverSocketId(postOwnerId);
        if (postOwnerSocketId) {
          const populatedNotification = await notification.populate([
            { path: "sender", select: "username profilePicture" },
            { path: "post", select: "image caption" }
          ]);

          io.to(postOwnerSocketId).emit("newNotification", populatedNotification);
          console.log("✅ Like notification sent and saved to database");
        }
      }
    }

    // Get updated post data
    const updatedPost = await Post.findById(postId);

    // Broadcast like update to OTHER users (not the current user)
    const likeUpdateData = {
      postId: postId,
      likesCount: updatedPost.likes.length,
      action: "like",
      userId: likeKarneWalaUserkiId,
    };

    // Always broadcast with excludeUserId - don't depend on socket ID
    io.emit("postLikeUpdate", {
      ...likeUpdateData,
      excludeUserId: likeKarneWalaUserkiId
    });

    // Return personalized response with like status for this user
    return res.status(200).json({
      message: "Post liked successfully",
      success: true,
      isLiked: true,
      likesCount: updatedPost.likes.length,
      postId: postId
    });
  } catch (error) {
    return res.status(500).json({ message: "Error liking post", error });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const likeKarneWalaUserkiId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }
    await post.updateOne({ $pull: { likes: likeKarneWalaUserkiId } });
    const user = await User.findById(likeKarneWalaUserkiId).select(
      "username profilePicture"
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== likeKarneWalaUserkiId) {
      // Notify post owner about the like
      const notification = {
        type: "dislike",
        userId: likeKarneWalaUserkiId,
        userDetails: user,
        postId,
        message: `${user.username} disliked your post.`,
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit("Notification", notification);
    }

    // Get updated post data
    const updatedPost = await Post.findById(postId);

    // Broadcast dislike update to OTHER users (not the current user)
    const likeUpdateData = {
      postId: postId,
      likesCount: updatedPost.likes.length,
      action: "dislike",
      userId: likeKarneWalaUserkiId,
    };

    // Always broadcast with excludeUserId - don't depend on socket ID
    io.emit("postLikeUpdate", {
      ...likeUpdateData,
      excludeUserId: likeKarneWalaUserkiId
    });

    // Return personalized response with like status for this user
    return res.status(200).json({
      message: "Post disliked successfully",
      success: true,
      isLiked: false,
      likesCount: updatedPost.likes.length,
      postId: postId
    });
  } catch (error) {
    return res.status(500).json({ message: "Error disliking post", error });
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentKrneWalaUserkiId = req.id;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const comment = await Comment.create({
      text,
      author: commentKrneWalaUserkiId,
      post: postId,
    });

    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });
    post.comments.push(comment._id);
    await post.save();

    // Notify post owner about the comment
    const postOwnerId = post.author.toString();
    if (postOwnerId !== commentKrneWalaUserkiId) {
      const user = await User.findById(commentKrneWalaUserkiId).select(
        "username profilePicture"
      );

      // Create notification in database
      const notification = await createNotification({
        recipient: postOwnerId,
        sender: commentKrneWalaUserkiId,
        type: "comment",
        post: postId,
        comment: comment._id,
        message: `${user.username} commented on your post`,
      });

      if (notification) {
        // Send real-time notification if user is online
        const postOwnerSocketId = getReceiverSocketId(postOwnerId);
        if (postOwnerSocketId) {
          const populatedNotification = await notification.populate([
            { path: "sender", select: "username profilePicture" },
            { path: "post", select: "image caption" }
          ]);

          io.to(postOwnerSocketId).emit("newNotification", populatedNotification);
          console.log("✅ Comment notification sent and saved to database");
        }
      }
    }

    return res
      .status(201)
      .json({ message: "Comment added successfully", comment, success: true });
  } catch (error) {
    return res.status(500).json({ message: "Error adding comment", error });
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username",
      " profilePicture"
    );

    if (!comments) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    return res.status(200).json({
      message: "Comments retrieved successfully",
      comments,
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving comments", error });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    if (post.author.toString() !== authorId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post",
        success: false,
      });
    }

    await Post.findByIdAndDelete(postId);

    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting post", error });
  }
};
export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(400).json({
        message: "Post removed from bookmarks",
        success: true,
        type: "unsaved",
      });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        message: "Post bookmarked successfully",
        success: true,
        type: "saved",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error bookmarking post", error });
  }
};
