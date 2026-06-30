import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

const REACTIONS = [
  { key: "heart", emoji: "❤️", label: "Love" },
  { key: "hug", emoji: "🤗", label: "Hug" },
  { key: "smile", emoji: "😊", label: "Smile" },
];

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isLiked = post.likes?.some((l) => (l._id || l) === user._id);
  const myReaction = REACTIONS.find((r) =>
    post.reactions?.[r.key]?.some((id) => (id._id || id) === user._id),
  );

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setPost((p) => ({
        ...p,
        likes: res.data.liked
          ? [...(p.likes || []), { _id: user._id }]
          : (p.likes || []).filter((l) => (l._id || l) !== user._id),
      }));
    } catch {
      toast.error("Could not update like");
    }
  };

  const handleReaction = async (type) => {
    try {
      const res = await api.post(`/posts/${post._id}/react`, { type });
      setPost((p) => ({ ...p, reactions: res.data.reactions }));
      setShowReactions(false);
    } catch {
      toast.error("Could not add reaction");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, {
        text: comment,
      });
      setPost((p) => ({
        ...p,
        comments: [...(p.comments || []), res.data.comment],
      }));
      setComment("");
    } catch {
      toast.error("Could not post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Could not delete post");
    }
  };

  const totalReactions = REACTIONS.reduce(
    (sum, r) => sum + (post.reactions?.[r.key]?.length || 0),
    0,
  );

  return (
    <article style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <Link
          to={`/profile/${post.author?.username}`}
          style={styles.authorLink}
        >
          <img
            src={
              post.author?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || "U")}&background=4f7c6b&color=fff&size=40`
            }
            alt={post.author?.name}
            style={styles.avatar}
          />
          <div>
            <span style={styles.authorName}>{post.author?.name}</span>
            <span style={styles.authorMeta}>
              @{post.author?.username} ·{" "}
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </Link>
        {post.author?._id === user._id && (
          <button
            onClick={handleDelete}
            style={styles.deleteBtn}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Caption */}
      {post.caption && <p style={styles.caption}>{post.caption}</p>}

      {/* Image */}
      {post.image && (
        <div style={styles.imageWrap}>
          <img src={post.image} alt="post" style={styles.postImage} />
        </div>
      )}

      {/* Stats */}
      {(post.likes?.length > 0 ||
        totalReactions > 0 ||
        post.comments?.length > 0) && (
        <div style={styles.stats}>
          {post.likes?.length > 0 && (
            <span style={styles.stat}>👍 {post.likes.length}</span>
          )}
          {totalReactions > 0 && (
            <span style={styles.stat}>
              {REACTIONS.filter(
                (r) => (post.reactions?.[r.key]?.length || 0) > 0,
              )
                .map((r) => r.emoji)
                .join("")}{" "}
              {totalReactions}
            </span>
          )}
          {post.comments?.length > 0 && (
            <span
              style={{ ...styles.stat, cursor: "pointer", marginLeft: "auto" }}
              onClick={() => setShowComments(!showComments)}
            >
              💬 {post.comments.length} comment
              {post.comments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={handleLike}
          style={{
            ...styles.actionBtn,
            ...(isLiked ? styles.actionBtnActive : {}),
          }}
        >
          {isLiked ? "👍" : "👍"} {isLiked ? "Liked" : "Like"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            style={{
              ...styles.actionBtn,
              ...(myReaction ? styles.actionBtnActive : {}),
            }}
          >
            {myReaction ? myReaction.emoji : "❤️"} React
          </button>
          {showReactions && (
            <div style={styles.reactionPicker}>
              {REACTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleReaction(r.key)}
                  style={styles.reactionOption}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          style={styles.actionBtn}
        >
          💬 Comment
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={styles.comments}>
          {post.comments?.map((c) => (
            <div key={c._id} style={styles.comment}>
              <img
                src={
                  c.user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || "U")}&background=4f7c6b&color=fff&size=28`
                }
                alt={c.user?.name}
                style={styles.commentAvatar}
              />
              <div style={styles.commentBody}>
                <span style={styles.commentName}>{c.user?.name}</span>
                <span style={styles.commentText}>{c.text}</span>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} style={styles.commentForm}>
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4f7c6b&color=fff&size=28`
              }
              alt="me"
              style={styles.commentAvatar}
            />
            <input
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={styles.commentInput}
              disabled={submittingComment}
            />
            <button
              type="submit"
              disabled={!comment.trim() || submittingComment}
              style={styles.commentSubmit}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

const styles = {
  card: {
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
  },
  authorLink: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  avatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
  authorName: {
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  authorMeta: { fontSize: 12, color: "var(--text-muted)" },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    opacity: 0.5,
  },
  caption: {
    padding: "0 16px 12px",
    fontSize: 15,
    color: "var(--text-primary)",
    lineHeight: 1.5,
  },
  imageWrap: { background: "#f0f0f0" },
  postImage: { width: "100%", maxHeight: 500, objectFit: "cover" },
  stats: {
    display: "flex",
    gap: 12,
    padding: "8px 16px",
    fontSize: 13,
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-light)",
  },
  stat: {},
  actions: {
    display: "flex",
    gap: 4,
    padding: "4px 8px",
    borderBottom: "1px solid var(--border-light)",
  },
  actionBtn: {
    flex: 1,
    padding: "8px 4px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  actionBtnActive: { color: "var(--primary)", background: "var(--primary-50)" },
  reactionPicker: {
    position: "absolute",
    bottom: "110%",
    left: 0,
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  reactionOption: {
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 14,
    background: "none",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    textAlign: "left",
    color: "var(--text-primary)",
  },
  comments: {
    padding: "8px 12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  comment: { display: "flex", gap: 8, alignItems: "flex-start" },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  commentBody: {
    background: "var(--bg)",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 13,
  },
  commentName: {
    fontWeight: 600,
    marginRight: 6,
    color: "var(--text-primary)",
  },
  commentText: { color: "var(--text-secondary)" },
  commentForm: { display: "flex", gap: 8, alignItems: "center", marginTop: 4 },
  commentInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 20,
    border: "1.5px solid var(--border)",
    fontSize: 13,
    background: "var(--bg)",
    color: "var(--text-primary)",
  },
  commentSubmit: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
  },
};
