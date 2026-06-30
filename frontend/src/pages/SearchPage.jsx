import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requests, setRequests] = useState({});

  const isFriend = (userId) =>
    user?.friends?.some((f) => (f._id || f) === userId);

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (query.trim().length < 2)
        return toast.error("Enter at least 2 characters");
      setLoading(true);
      try {
        const res = await api.get(
          `/users/search?q=${encodeURIComponent(query)}`,
        );
        setResults(res.data.users);
        setSearched(true);
      } catch {
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      setRequests((prev) => ({ ...prev, [userId]: true }));
      toast.success("Friend request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <h1 style={styles.title}>Find People</h1>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" disabled={loading} style={styles.searchBtn}>
            {loading ? "..." : "🔍 Search"}
          </button>
        </form>

        {searched && results.length === 0 && (
          <div style={styles.empty}>
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No users found for "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div style={styles.results}>
            {results.map((u) => {
              const friend = isFriend(u._id);
              const sent = requests[u._id];
              return (
                <div key={u._id} style={styles.card}>
                  <Link to={`/profile/${u.username}`} style={styles.userLink}>
                    <img
                      src={
                        u.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f7c6b&color=fff&size=48`
                      }
                      alt={u.name}
                      style={styles.avatar}
                    />
                    <div style={styles.userInfo}>
                      <span style={styles.name}>{u.name}</span>
                      <span style={styles.handle}>@{u.username}</span>
                      {u.bio && <span style={styles.bio}>{u.bio}</span>}
                    </div>
                  </Link>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/messages/${u._id}`)}
                      style={styles.msgBtn}
                    >
                      💬
                    </button>
                    {!friend && (
                      <button
                        onClick={() => handleConnect(u._id)}
                        disabled={sent}
                        style={sent ? styles.sentBtn : styles.connectBtn}
                      >
                        {sent ? "Sent ✓" : "+ Connect"}
                      </button>
                    )}
                    {friend && (
                      <span style={styles.friendBadge}>Friends ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!searched && (
          <div style={styles.hint}>
            <span style={{ fontSize: 48 }}>👥</span>
            <h3>Search for family and friends</h3>
            <p>Stay close to the people who matter most.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px 24px", maxWidth: 700, margin: "0 auto" },
  inner: {},
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 20,
  },
  searchForm: { display: "flex", gap: 10, marginBottom: 24 },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid var(--border)",
    fontSize: 15,
    background: "#fff",
    color: "var(--text-primary)",
  },
  searchBtn: {
    padding: "12px 20px",
    borderRadius: 12,
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  results: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid var(--border)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    textDecoration: "none",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  userInfo: { display: "flex", flexDirection: "column" },
  name: { fontWeight: 700, fontSize: 15, color: "var(--text-primary)" },
  handle: { fontSize: 13, color: "var(--text-muted)" },
  bio: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 },
  cardActions: { display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
  msgBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--primary-50)",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  sentBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    background: "var(--primary-50)",
    color: "var(--primary)",
    border: "1px solid var(--primary-100)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "default",
  },
  friendBadge: {
    padding: "5px 10px",
    borderRadius: 8,
    background: "var(--primary-50)",
    color: "var(--primary)",
    fontSize: 12,
    fontWeight: 600,
  },
  empty: { textAlign: "center", padding: 40, color: "var(--text-muted)" },
  hint: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-secondary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
};
