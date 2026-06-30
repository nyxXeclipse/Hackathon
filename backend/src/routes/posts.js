const express = require("express");
const router = express.Router();
const {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  toggleLike,
  addReaction,
  addComment,
  deletePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.post("/", upload.single("image"), createPost);
router.get("/feed", getFeed);
router.get("/user/:userId", getUserPosts);
router.get("/:postId", getPost);
router.post("/:postId/like", toggleLike);
router.post("/:postId/react", addReaction);
router.post("/:postId/comments", addComment);
router.delete("/:postId", deletePost);

module.exports = router;
