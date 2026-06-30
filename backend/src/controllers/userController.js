const User = require("../models/User");

// @GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Search query must be at least 2 characters",
        });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    })
      .select("name username avatar bio isOnline")
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/users/:username
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password -friendRequestsReceived -friendRequestsSent")
      .populate("friends", "name username avatar isOnline");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;

    // Handle avatar upload
    if (req.file) {
      // In production: upload to ImageKit and store URL
      // For now store as base64 data URL placeholder
      updates.avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate("friends", "name username avatar isOnline");

    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/users/friend-request/:userId
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot send request to yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if already friends
    if (
      targetUser.friends.some(
        (id) => id.toString() === currentUserId.toString(),
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Already friends" });
    }

    // Check if request already sent
    if (
      targetUser.friendRequestsReceived.some(
        (id) => id.toString() === currentUserId.toString(),
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Friend request already sent" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friendRequestsReceived: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friendRequestsSent: userId },
    });

    res.json({ success: true, message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/users/friend-request/:userId/accept
const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (
      !currentUser.friendRequestsReceived.some((id) => id.toString() === userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "No pending friend request from this user",
      });
    }

    // Add each other as friends
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: userId },
      $pull: { friendRequestsReceived: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: currentUserId },
      $pull: { friendRequestsSent: currentUserId },
    });

    res.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/users/friend-request/:userId/decline
const declineFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friendRequestsReceived: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { friendRequestsSent: currentUserId },
    });

    res.json({ success: true, message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @DELETE /api/users/friends/:userId
const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { friends: currentUserId } });

    res.json({ success: true, message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/users/suggestions
const getFriendSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excludeIds = [
      req.user._id,
      ...currentUser.friends,
      ...currentUser.friendRequestsSent,
      ...currentUser.friendRequestsReceived,
    ];

    const suggestions = await User.find({ _id: { $nin: excludeIds } })
      .select("name username avatar bio")
      .limit(10);

    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  updateProfile,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendSuggestions,
};
