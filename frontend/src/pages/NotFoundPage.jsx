import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={styles.page}>
      <span style={{ fontSize: 64 }}>🌿</span>
      <h1 style={styles.code}>404</h1>
      <h2 style={styles.title}>Page not found</h2>
      <p style={styles.desc}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/feed" style={styles.btn}>
        Go Home
      </Link>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    gap: 12,
    textAlign: "center",
    padding: 20,
  },
  code: {
    fontSize: 80,
    fontWeight: 800,
    color: "var(--primary)",
    lineHeight: 1,
  },
  title: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)" },
  desc: { fontSize: 15, color: "var(--text-secondary)", maxWidth: 340 },
  btn: {
    marginTop: 8,
    padding: "12px 28px",
    background: "var(--primary)",
    color: "#fff",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 15,
    textDecoration: "none",
  },
};
