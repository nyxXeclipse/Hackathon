const Message = require("../models/Message");
const User = require("../models/User");

// @GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all users the current user has chatted with
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name username avatar isOnline lastSeen")
      .populate("receiver", "name username avatar isOnline lastSeen");

    // Build unique conversation list
    const conversationsMap = new Map();
    messages.forEach((msg) => {
      const other =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;
      const otherId = other._id.toString();
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          user: other,
          lastMessage: msg,
          unread:
            msg.receiver._id.toString() === userId.toString() && !msg.read
              ? 1
              : 0,
        });
      } else if (
        msg.receiver._id.toString() === userId.toString() &&
        !msg.read
      ) {
        conversationsMap.get(otherId).unread++;
      }
    });

    const conversations = Array.from(conversationsMap.values());
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 30 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("sender", "name username avatar");

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true },
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/messages/:userId
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { userId } = req.params;

    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Message text is required" });
    }

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: userId,
      text: text.trim(),
    });

    await message.populate("sender", "name username avatar");

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
