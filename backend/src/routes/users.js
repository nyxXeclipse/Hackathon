const express = require("express");
const router = express.Router();
const {
  searchUsers,
  getUserProfile,
  updateProfile,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendSuggestions,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.get("/search", searchUsers);
router.get("/suggestions", getFriendSuggestions);
router.get("/:username", getUserProfile);
router.put("/profile", upload.single("avatar"), updateProfile);
router.post("/friend-request/:userId", sendFriendRequest);
router.post("/friend-request/:userId/accept", acceptFriendRequest);
router.post("/friend-request/:userId/decline", declineFriendRequest);
router.delete("/friends/:userId", removeFriend);

module.exports = router;
