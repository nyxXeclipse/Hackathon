const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      maxlength: [500, "Caption cannot exceed 500 characters"],
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    imageFileId: {
      type: String,
      default: "",
    },
    postType: {
      type: String,
      enum: ["update", "photo", "moment"],
      default: "update",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    reactions: {
      heart: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      hug: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      smile: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    visibility: {
      type: String,
      enum: ["public", "friends", "family"],
      default: "friends",
    },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
