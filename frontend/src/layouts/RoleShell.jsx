import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaCrown,
  FaMoon,
  FaSearch,
  FaSignOutAlt,
  FaSun,
} from "react-icons/fa";
import { clearSession, displayUserName, displayUserTitle, userInitials } from "../utils/auth.js";
import { getStoredTheme, setStoredTheme } from "../utils/theme.js";
import { useNotifications } from "../context/NotificationContext.jsx";

function RoleShell({
  title,
  subtitle,
  eyebrow,
  user,
  navItems,
  activePage,
  setActivePage,
  children,
  planTitle = "Workspace Plan",
  planText = "Plan usage, deliverability, and workspace controls",
  onOpenBilling,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}) {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkModeState] = useState(getStoredTheme());
  const navigate = useNavigate();
  const roleSlug = (user?.role || "User").toLowerCase();

  const setDarkMode = (value) => {
    setDarkModeState(value);
    setStoredTheme(value);
  };

  const handleNav = (item) => {
    if (item.to) {
      navigate(item.to);
      return;
    }
    setActivePage(item.name);
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className={`layout role-shell role-${roleSlug} ${darkMode ? "dark-mode" : ""} ${open ? "sidebar-open" : "sidebar-collapsed"}`}>
      <aside className={open ? "sidebar" : "sidebar collapsed"}>
        <div className="top-section">
          <h2>
            Mail<span>Nova</span>
          </h2>
          <FaBars className="menu-icon" onClick={() => setOpen(!open)} />
        </div>

        <ul>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={`${item.name}-${item.to || ""}`}
                className={activePage === item.name && !item.to ? "active" : ""}
                onClick={() => handleNav(item)}
                style={{ "--item-index": index }}
              >
                <Icon />
                {open && item.name}
              </li>
            );
          })}
          <li onClick={logout}>
            <FaSignOutAlt />
            {open && "Logout"}
          </li>
        </ul>

        {open && (
          <div className="upgrade-box">
            <FaCrown style={{ fontSize: "22px", marginBottom: "8px" }} />
            <h4>{planTitle}</h4>
            <p>{planText}</p>
            <button onClick={onOpenBilling || (() => alert("Billing management is only available for workspace owners/administrators."))}>Open Billing</button>
          </div>
        )}
      </aside>

      <main className="main">
        <div className="main-content-container">
          <div className="navbar">
            <form
              className="role-search"
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit?.();
              }}
            >
              <FaSearch />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </form>

            <div className="nav-right">
              <div className="icon-box notification-nav-icon" onClick={() => setActivePage("Notifications")} style={{ position: "relative" }}>
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-nav-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <div className="icon-box" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <FaSun /> : <FaMoon />}
              </div>
              <div className="profile">
                <div className="profile-avatar" aria-hidden="true">
                  {userInitials(user)}
                </div>
                <div>
                  <h4>{displayUserName(user)}</h4>
                  <p>{displayUserTitle(user)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-strip">
            <div className="breadcrumbs">
              <span>MailNova Pro</span>
              <strong>{activePage}</strong>
            </div>
            <div className="command-trigger" style={{ cursor: "default" }}>
              {eyebrow}
              <span>{user?.role || "User"}</span>
            </div>
          </div>

          <section className="dashboard-stage" key={activePage}>
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}

export default RoleShell;
