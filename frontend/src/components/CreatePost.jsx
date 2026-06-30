import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Image must be under 10MB");
    }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !image)
      return toast.error("Add some text or a photo");

    setLoading(true);
    try {
      const formData = new FormData();
      if (caption) formData.append("caption", caption);
      if (image) formData.append("image", image);

      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCaption("");
      setImage(null);
      setPreview(null);
      onPostCreated?.(res.data.post);
      toast.success("Post shared! 🌿");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <img
          src={
            user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4f7c6b&color=fff&size=40`
          }
          alt={user?.name}
          style={styles.avatar}
        />
        <textarea
          placeholder={`What's on your mind, ${user?.name?.split(" ")[0]}?`}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={styles.textarea}
          rows={2}
        />
      </div>

      {preview && (
        <div style={styles.previewWrap}>
          <img src={preview} alt="preview" style={styles.preview} />
          <button
            onClick={() => {
              setImage(null);
              setPreview(null);
            }}
            style={styles.removeImg}
          >
            ✕
          </button>
        </div>
      )}

      <div style={styles.bottom}>
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          style={styles.photoBtn}
        >
          📷 Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          hidden
        />

        <button
          onClick={handleSubmit}
          disabled={loading || (!caption.trim() && !image)}
          style={{
            ...styles.postBtn,
            opacity: loading || (!caption.trim() && !image) ? 0.6 : 1,
          }}
        >
          {loading ? "Sharing..." : "Share"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    padding: "16px",
    marginBottom: 16,
  },
  top: { display: "flex", gap: 10, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "none",
    background: "transparent",
    fontSize: 15,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    fontFamily: "var(--font)",
    outline: "none",
  },
  previewWrap: { position: "relative", marginBottom: 12 },
  preview: {
    width: "100%",
    maxHeight: 300,
    objectFit: "cover",
    borderRadius: 10,
  },
  removeImg: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border-light)",
    paddingTop: 10,
  },
  photoBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    background: "var(--primary-50)",
    color: "var(--primary)",
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  postBtn: {
    padding: "8px 20px",
    borderRadius: 8,
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
