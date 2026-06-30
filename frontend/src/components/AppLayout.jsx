import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  { to: "/feed", icon: "🏠", label: "Home" },
  { to: "/search", icon: "🔍", label: "Search" },
  { to: "/messages", icon: "💬", label: "Messages" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("See you soon! 👋");
    navigate("/login");
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌿</span>
          <span style={styles.logoText}>EverNear</span>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to={`/profile/${user?.username}`}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>👤</span>
            <span style={styles.navLabel}>Profile</span>
          </NavLink>
        </nav>

        {/* User Card */}
        <div style={styles.userCard}>
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4f7c6b&color=fff&size=40`
            }
            alt={user?.name}
            style={styles.userAvatar}
            onClick={() => navigate(`/profile/${user?.username}`)}
          />
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userHandle}>@{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            title="Logout"
          >
            ⬅️
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header style={styles.mobileHeader}>
        <span style={styles.mobileLogo}>🌿 EverNear</span>
        <button onClick={() => setMenuOpen(!menuOpen)} style={styles.menuBtn}>
          ☰
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {[
            ...NAV,
            { to: `/profile/${user?.username}`, icon: "👤", label: "Profile" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={styles.mobileNavItem}
              onClick={() => setMenuOpen(false)}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} style={styles.mobileLogout}>
            ⬅️ Logout
          </button>
        </div>
      )}

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    background: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    position: "sticky",
    top: 0,
    height: "100vh",
    "@media (max-width: 768px)": { display: "none" },
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 8px 32px",
  },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--primary)",
    letterSpacing: "-0.5px",
  },
  nav: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    fontWeight: 500,
    fontSize: 15,
    transition: "all var(--transition)",
    textDecoration: "none",
  },
  navItemActive: {
    background: "var(--primary-50)",
    color: "var(--primary)",
  },
  navIcon: { fontSize: 20, width: 24, textAlign: "center" },
  navLabel: {},
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 8px",
    borderTop: "1px solid var(--border)",
    marginTop: "auto",
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    border: "2px solid var(--primary-100)",
  },
  userInfo: { flex: 1, overflow: "hidden" },
  userName: {
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userHandle: { fontSize: 12, color: "var(--text-muted)" },
  logoutBtn: {
    padding: "6px 8px",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
    background: "none",
    border: "none",
    opacity: 0.6,
    transition: "opacity var(--transition)",
  },
  mobileHeader: {
    display: "none",
    "@media (max-width: 768px)": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#fff",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
  },
  mobileLogo: { fontSize: 18, fontWeight: 700, color: "var(--primary)" },
  menuBtn: {
    fontSize: 22,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  mobileMenu: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#fff",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    padding: 24,
    gap: 8,
  },
  mobileNavItem: {
    padding: "14px 16px",
    borderRadius: 12,
    fontSize: 16,
    color: "var(--text-primary)",
    fontWeight: 500,
    textDecoration: "none",
  },
  mobileLogout: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 16,
    color: "#e57373",
    fontWeight: 500,
    background: "none",
    border: "none",
    cursor: "pointer",
    borderRadius: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    maxWidth: "calc(100vw - 260px)",
    "@media (max-width: 768px)": { maxWidth: "100vw" },
  },
};
