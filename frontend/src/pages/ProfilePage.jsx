import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  const isOwnProfile = currentUser?.username === username;

  const isFriend = profile?.friends?.some(
    (f) => (f._id || f) === currentUser?._id,
  );
  const requestSent = currentUser?.friendRequestsSent?.some(
    (id) => profile?._id && (id._id || id) === profile._id,
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get(`/users/${username}`);
        setProfile(profileRes.data.user);
        const pid = profileRes.data.user._id;
        const pRes = await api.get(`/posts/user/${pid}`);
        setPosts(pRes.data.posts);
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error("User not found");
          navigate("/feed");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, currentUser, navigate]);

  const handleEditSave = async () => {
    try {
      const formData = new FormData();
      if (editForm.name) formData.append("name", editForm.name);
      formData.append("bio", editForm.bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(res.data.user);
      setProfile(res.data.user);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Profile updated!");
    } catch {
      toast.error("Could not update profile");
    }
  };

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        await api.delete(`/users/friends/${profile._id}`);
        toast.success("Friend removed");
        setProfile((p) => ({
          ...p,
          friends: p.friends.filter((f) => (f._id || f) !== currentUser._id),
        }));
      } else {
        await api.post(`/users/friend-request/${profile._id}`);
        toast.success("Friend request sent!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleMessage = () => navigate(`/messages/${profile._id}`);

  if (loading)
    return (
      <div
        style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}
      >
        Loading profile...
      </div>
    );

  if (!profile) return null;

  const avatarSrc =
    avatarPreview ||
    profile.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4f7c6b&color=fff&size=100`;

  return (
    <div style={styles.page}>
      {/* Cover + Avatar */}
      <div style={styles.cover}>
        <div style={styles.coverGrad} />
        <div style={styles.avatarWrap}>
          <img src={avatarSrc} alt={profile.name} style={styles.avatar} />
          {isOwnProfile && editing && (
            <>
              <button
                onClick={() => fileRef.current.click()}
                style={styles.changeAvatarBtn}
              >
                📷
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setAvatarFile(f);
                  const reader = new FileReader();
                  reader.onloadend = () => setAvatarPreview(reader.result);
                  reader.readAsDataURL(f);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div style={styles.info}>
        {editing ? (
          <div style={styles.editForm}>
            <input
              placeholder="Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              style={styles.editInput}
            />
            <textarea
              placeholder="Bio"
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              style={{ ...styles.editInput, resize: "vertical", minHeight: 70 }}
              maxLength={200}
            />
            <div style={styles.editActions}>
              <button
                onClick={() => setEditing(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleEditSave} style={styles.saveBtn}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.nameRow}>
              <div>
                <h1 style={styles.name}>{profile.name}</h1>
                <span style={styles.handle}>@{profile.username}</span>
              </div>
              {isOwnProfile ? (
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditForm({ name: profile.name, bio: profile.bio || "" });
                  }}
                  style={styles.editBtn}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={styles.actionBtns}>
                  <button onClick={handleMessage} style={styles.msgBtn}>
                    💬 Message
                  </button>
                  <button
                    onClick={handleFriendAction}
                    style={isFriend ? styles.unfriendBtn : styles.friendBtn}
                  >
                    {isFriend
                      ? "Friends ✓"
                      : requestSent
                        ? "Requested"
                        : "+ Connect"}
                  </button>
                </div>
              )}
            </div>
            {profile.bio && <p style={styles.bio}>{profile.bio}</p>}
            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <span style={styles.statNum}>{posts.length}</span>
                <span style={styles.statLabel}>Posts</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statNum}>
                  {profile.friends?.length || 0}
                </span>
                <span style={styles.statLabel}>Friends</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Posts grid */}
      <div style={styles.posts}>
        <h2 style={styles.postsTitle}>Posts</h2>
        {posts.length === 0 ? (
          <div style={styles.noPosts}>
            <span style={{ fontSize: 36 }}>📷</span>
            <p>No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={(id) =>
                setPosts((prev) => prev.filter((p) => p._id !== id))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 680, margin: "0 auto", padding: "0 0 40px" },
  cover: {
    height: 180,
    background: "linear-gradient(135deg, #4f7c6b, #3a5e50)",
    borderRadius: "0 0 20px 20px",
    position: "relative",
    overflow: "visible",
  },
  coverGrad: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, #4f7c6b 0%, #6a9e8a 50%, #e8a87c 100%)",
    opacity: 0.9,
  },
  avatarWrap: {
    position: "absolute",
    bottom: -50,
    left: 24,
    zIndex: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    border: "4px solid #fff",
    objectFit: "cover",
  },
  changeAvatarBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--primary)",
    color: "#fff",
    border: "2px solid #fff",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: "60px 24px 0",
    background: "#fff",
    borderBottom: "1px solid var(--border)",
  },
  nameRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)" },
  handle: { fontSize: 14, color: "var(--text-muted)" },
  actionBtns: { display: "flex", gap: 8 },
  editBtn: {
    padding: "8px 18px",
    borderRadius: 10,
    border: "1.5px solid var(--border)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "#fff",
    color: "var(--text-primary)",
  },
  msgBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    background: "var(--primary-50)",
    color: "var(--primary)",
    border: "1px solid var(--primary-100)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  friendBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  unfriendBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    background: "var(--primary-50)",
    color: "var(--primary)",
    border: "1px solid var(--primary-100)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  bio: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  statsRow: { display: "flex", gap: 24, paddingBottom: 16 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: 700, color: "var(--text-primary)" },
  statLabel: { fontSize: 12, color: "var(--text-muted)" },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingBottom: 16,
  },
  editInput: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid var(--border)",
    fontSize: 14,
    fontFamily: "var(--font)",
    color: "var(--text-primary)",
    background: "var(--bg)",
  },
  editActions: { display: "flex", gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: "9px",
    borderRadius: 10,
    border: "1.5px solid var(--border)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "#fff",
  },
  saveBtn: {
    flex: 1,
    padding: "9px",
    borderRadius: 10,
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  posts: { padding: "24px 24px 0" },
  postsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 16,
  },
  noPosts: { textAlign: "center", padding: 40, color: "var(--text-muted)" },
};
