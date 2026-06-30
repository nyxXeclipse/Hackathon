import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  const loadFeed = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get(`/posts/feed?page=${pageNum}&limit=10`);
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts((prev) => [...prev, ...res.data.posts]);
      }
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    } catch {
      toast.error("Could not load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await api.get("/users/suggestions");
      setSuggestions(res.data.suggestions.slice(0, 4));
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    loadFeed(1);
    loadSuggestions();
  }, [loadFeed, loadSuggestions]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== userId));
      toast.success("Friend request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request");
    }
  };

  return (
    <div style={styles.layout}>
      {/* Main feed */}
      <div style={styles.feed}>
        <CreatePost onPostCreated={handlePostCreated} />

        {loading ? (
          <div style={styles.loadingWrap}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 48 }}>🌱</span>
            <h3>Your feed is empty</h3>
            <p>Connect with friends and family to see their updates here.</p>
            <Link to="/search" style={styles.emptyBtn}>
              Find People
            </Link>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
              />
            ))}
            {hasMore && (
              <button onClick={handleLoadMore} style={styles.loadMore}>
                Load more
              </button>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside style={styles.sidebar}>
        {/* Current user */}
        <div style={styles.meCard}>
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4f7c6b&color=fff&size=48`
            }
            alt={user?.name}
            style={styles.meAvatar}
          />
          <div>
            <div style={styles.meName}>{user?.name}</div>
            <div style={styles.meHandle}>@{user?.username}</div>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={styles.suggestions}>
            <h3 style={styles.suggestTitle}>People you may know</h3>
            {suggestions.map((s) => (
              <div key={s._id} style={styles.suggestItem}>
                <Link to={`/profile/${s.username}`} style={styles.suggestUser}>
                  <img
                    src={
                      s.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=6a9e8a&color=fff&size=32`
                    }
                    alt={s.name}
                    style={styles.suggestAvatar}
                  />
                  <div>
                    <div style={styles.suggestName}>{s.name}</div>
                    <div style={styles.suggestHandle}>@{s.username}</div>
                  </div>
                </Link>
                <button
                  onClick={() => handleConnect(s._id)}
                  style={styles.connectBtn}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          EverNear · Stay close, no matter the distance 🌿
        </div>
      </aside>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    gap: 24,
    padding: "24px 24px 24px 24px",
    maxWidth: 1100,
    margin: "0 auto",
  },
  feed: { flex: 1, minWidth: 0 },
  loadingWrap: { display: "flex", flexDirection: "column", gap: 16 },
  skeleton: {
    height: 200,
    borderRadius: 16,
    background: "linear-gradient(90deg, #e8f0ec 25%, #f0f5f2 50%, #e8f0ec 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease infinite",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-secondary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  emptyBtn: {
    marginTop: 8,
    padding: "10px 24px",
    background: "var(--primary)",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
  },
  loadMore: {
    width: "100%",
    padding: "12px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "var(--primary)",
    cursor: "pointer",
  },
  sidebar: {
    width: 280,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  meCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid var(--border)",
    padding: "14px",
  },
  meAvatar: { width: 46, height: 46, borderRadius: "50%", objectFit: "cover" },
  meName: { fontWeight: 600, fontSize: 15 },
  meHandle: { fontSize: 12, color: "var(--text-muted)" },
  suggestions: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid var(--border)",
    padding: "14px",
  },
  suggestTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 12,
  },
  suggestItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  suggestUser: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  suggestAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover",
  },
  suggestName: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" },
  suggestHandle: { fontSize: 11, color: "var(--text-muted)" },
  connectBtn: {
    padding: "5px 10px",
    borderRadius: 7,
    background: "var(--primary-50)",
    color: "var(--primary)",
    border: "1px solid var(--primary-100)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  footer: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
    padding: "4px 0",
  },
};
