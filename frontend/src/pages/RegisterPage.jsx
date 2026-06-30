import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome to EverNear 🌿");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={{ fontSize: 40 }}>🌿</span>
          <h1 style={styles.brandName}>Join EverNear</h1>
          <p style={styles.tagline}>Connect with the people who matter most.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                placeholder="Aarav Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                placeholder="aarav_s"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase() })
                }
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="aarav@example.com"
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
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
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
    padding: "36px 32px",
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 8px 40px rgba(79, 124, 107, 0.12)",
  },
  brand: { textAlign: "center", marginBottom: 28 },
  brandName: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--primary)",
    margin: "6px 0 4px",
  },
  tagline: { fontSize: 14, color: "var(--text-secondary)" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  label: { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" },
  input: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "1.5px solid var(--border)",
    fontSize: 14,
    background: "var(--bg)",
    color: "var(--text-primary)",
  },
  btn: {
    marginTop: 6,
    padding: "13px",
    background: "var(--primary)",
    color: "#fff",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
  },
  footer: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  link: { color: "var(--primary)", fontWeight: 600 },
};
