import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import { createNotification } from "./notification.controller.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(401).json({ message: "All fields are required", success: false });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ message: "All fields are required", success: false });
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password", success: false });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Incorrect email or password", success: false });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
      isVerified: user.isVerified,
      subscription: user.subscription,
    };

    return res
      .cookie("token", token, { httpOnly: true, sameSite: "strict", maxAge: 1 * 24 * 60 * 60 * 1000 })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
        token,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const logout = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId)
      .populate({ path: "posts", createdAt: -1 })
      .populate("bookmarks")
      .populate({
        path: "followers",
        select: "username profilePicture isVerified"
      })
      .populate({
        path: "following",
        select: "username profilePicture isVerified"
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;

    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.id).select("following");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const suggestedUsers = await User.find({
      _id: { $ne: req.id }
    })
      .select("-password")
      .limit(5);

    if (!suggestedUsers || suggestedUsers.length === 0) {
      return res.status(200).json({
        message: "No suggested users found",
        success: true,
        users: []
      });
    }

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followKrneWala = req.id;
    const jiskoFollowKrunga = req.params.id;

    if (followKrneWala === jiskoFollowKrunga) {
      return res.status(400).json({
        message: "You cannot follow/unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(followKrneWala);
    const targetUser = await User.findById(jiskoFollowKrunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    const isFollowing = user.following.includes(jiskoFollowKrunga);

    if (isFollowing) {
      await Promise.all([
        User.updateOne({ _id: followKrneWala }, { $pull: { following: jiskoFollowKrunga } }),
        User.updateOne({ _id: jiskoFollowKrunga }, { $pull: { followers: followKrneWala } }),
      ]);

      // Get updated counts
      const updatedUser = await User.findById(followKrneWala).select("following followers");
      const updatedTargetUser = await User.findById(jiskoFollowKrunga).select("following followers");

      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true,
        action: "unfollow",
        userFollowingCount: updatedUser.following.length,
        userFollowersCount: updatedUser.followers.length,
        targetUserFollowersCount: updatedTargetUser.followers.length,
        targetUserFollowingCount: updatedTargetUser.following.length
      });
    } else {
      await Promise.all([
        User.updateOne({ _id: followKrneWala }, { $push: { following: jiskoFollowKrunga } }),
        User.updateOne({ _id: jiskoFollowKrunga }, { $push: { followers: followKrneWala } }),
      ]);

      // Create follow notification
      const follower = await User.findById(followKrneWala).select("username profilePicture");
      const notification = await createNotification({
        recipient: jiskoFollowKrunga,
        sender: followKrneWala,
        type: "follow",
        message: `${follower.username} started following you`,
      });

      if (notification) {
        // Send real-time notification if user is online
        const targetUserSocketId = getReceiverSocketId(jiskoFollowKrunga);
        if (targetUserSocketId) {
          const populatedNotification = await notification.populate([
            { path: "sender", select: "username profilePicture" }
          ]);

          io.to(targetUserSocketId).emit("newNotification", populatedNotification);
          console.log("✅ Follow notification sent and saved to database");
        }
      }

      // Get updated counts
      const updatedUser = await User.findById(followKrneWala).select("following followers");
      const updatedTargetUser = await User.findById(jiskoFollowKrunga).select("following followers");

      return res.status(200).json({
        message: "Followed successfully",
        success: true,
        action: "follow",
        userFollowingCount: updatedUser.following.length,
        userFollowersCount: updatedUser.followers.length,
        targetUserFollowersCount: updatedTargetUser.followers.length,
        targetUserFollowingCount: updatedTargetUser.following.length
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(200).json({
        success: true,
        users: [],
        message: "Please enter a search term"
      });
    }

    // Get current user's following list
    const currentUser = await User.findById(req.id).select("following");
    const followingIds = currentUser?.following || [];

    const users = await User.find({
      $and: [
        { _id: { $ne: req.id } },
        { _id: { $nin: followingIds } }, // Exclude users already being followed
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
          ]
        }
      ]
    })
    .select("-password")
    .limit(10);

    return res.status(200).json({
      success: true,
      users: users,
      message: users.length > 0 ? "Users found" : "No users found"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .populate({
        path: "followers",
        select: "username email profilePicture followers following isVerified"
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      followers: user.followers,
      message: "Followers fetched successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .populate({
        path: "following",
        select: "username email profilePicture followers following isVerified"
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      following: user.following,
      message: "Following fetched successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};