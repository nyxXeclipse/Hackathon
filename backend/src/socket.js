const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status
    socket.broadcast.emit("user:online", { userId });
    socket.emit("online:users", Array.from(onlineUsers.keys()));

    console.log(`✅ Socket connected: ${socket.user.username} (${socket.id})`);

    // Join personal room
    socket.join(userId);

    // Handle private message
    socket.on("message:send", async (data) => {
      try {
        const { receiverId, text } = data;
        if (!receiverId || !text) return;

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
        });

        await message.populate("sender", "name username avatar");

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverId).emit("message:receive", message);
        }

        // Confirm back to sender
        socket.emit("message:sent", message);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicators
    socket.on("typing:start", ({ receiverId }) => {
      io.to(receiverId).emit("typing:start", {
        userId,
        username: socket.user.username,
      });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      io.to(receiverId).emit("typing:stop", { userId });
    });

    // Post notifications
    socket.on("post:new", (data) => {
      // Broadcast new post to friends
      socket.broadcast.emit("post:new", data);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      socket.broadcast.emit("user:offline", { userId });
      console.log(`❌ Socket disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { initSocket, onlineUsers };
