const Post = require("../models/Post");
const User = require("../models/User");

// @POST /api/posts
const createPost = async (req, res) => {
  try {
    const { caption, postType, visibility } = req.body;

    if (!caption && !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Post must have text or image" });
    }

    const postData = {
      author: req.user._id,
      caption: caption || "",
      postType: postType || "update",
      visibility: visibility || "friends",
    };

    if (req.file) {
      // In production: upload to ImageKit, store URL
      postData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      postData.postType = "photo";
    }

    const post = await Post.create(postData);
    await post.populate("author", "name username avatar");

    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/posts/feed
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const currentUser = await User.findById(req.user._id);
    const friendIds = [...currentUser.friends, req.user._id];

    const posts = await Post.find({ author: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("author", "name username avatar isOnline")
      .populate("comments.user", "name username avatar")
      .populate("likes", "name username");

    const total = await Post.countDocuments({ author: { $in: friendIds } });

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("author", "name username avatar")
      .populate("comments.user", "name username avatar");

    const total = await Post.countDocuments({ author: req.params.userId });

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @GET /api/posts/:postId
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "name username avatar isOnline")
      .populate("comments.user", "name username avatar")
      .populate("likes", "name username avatar");

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/posts/:postId/like
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

        const liked = post.likes.some(
          (id) => id.toString() === req.user._id.toString(),
        );
    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    res.json({ success: true, liked: !liked, likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/posts/:postId/react
const addReaction = async (req, res) => {
  try {
    const { type } = req.body; // heart, hug, smile
    if (!["heart", "hug", "smile"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reaction type" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    // Toggle reaction
    const hasReacted = post.reactions[type].some(
      (id) => id.toString() === req.user._id.toString(),
    );
    if (hasReacted) {
      post.reactions[type].pull(req.user._id);
    } else {
      // Remove any other reaction from this user first
      ["heart", "hug", "smile"].forEach((r) => {
        if (r !== type) post.reactions[r].pull(req.user._id);
      });
      post.reactions[type].push(req.user._id);
    }

    await post.save();
    res.json({ success: true, reactions: post.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @POST /api/posts/:postId/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate("comments.user", "name username avatar");

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @DELETE /api/posts/:postId
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this post",
        });
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  toggleLike,
  addReaction,
  addComment,
  deletePost,
};
