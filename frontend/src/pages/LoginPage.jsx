import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back! 🌿");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🌿</span>
          <h1 style={styles.brandName}>EverNear</h1>
          <p style={styles.tagline}>Stay close, no matter the distance.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Welcome back</h2>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eef5f2 0%, #d6ebe4 100%)",
    padding: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 8px 40px rgba(79, 124, 107, 0.12)",
  },
  brand: { textAlign: "center", marginBottom: 32 },
  brandIcon: { fontSize: 44 },
  brandName: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--primary)",
    margin: "8px 0 4px",
  },
  tagline: { color: "var(--text-secondary)", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" },
  input: {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--border)",
    fontSize: 15,
    background: "var(--bg)",
    color: "var(--text-primary)",
    transition: "border-color 0.2s",
  },
  btn: {
    marginTop: 8,
    padding: "13px",
    background: "var(--primary)",
    color: "#fff",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "background 0.2s",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  link: { color: "var(--primary)", fontWeight: 600 },
};
