import { useState, useEffect } from "react";
import {
  MdEmail,
  MdSettings,
  MdWarning,
  MdTrendingUp,
  MdSearch,
  MdDoneAll,
  MdArrowBack,
  MdNotificationsActive,
  MdMessage,
  MdSupportAgent,
  MdPersonAdd,
  MdSend
} from "react-icons/md";
import { useNotifications } from "../context/NotificationContext";

const categoryIcons = {
  "New Contact Message": MdMessage,
  "Support Message": MdSupportAgent,
  "Lead Generated": MdPersonAdd,
  "System Alert": MdWarning,
  campaign: MdEmail,
  system: MdSettings,
  warning: MdWarning,
  growth: MdTrendingUp
};

const categoryColors = {
  "New Contact Message": "#2563eb",
  "Support Message": "#0d9488",
  "Lead Generated": "#16a34a",
  "System Alert": "#dc2626",
  campaign: "#2563eb",
  system: "#64748b",
  warning: "#dc2626",
  growth: "#16a34a"
};

export default function Notifications({
  theme,
  notifications: passedNotifications,
  onMarkRead,
  onMarkAllRead,
  compactLimit = 5,
  showSimulator = false,
}) {
  const notificationContext = useNotifications();
  const notifications = Array.isArray(passedNotifications) ? passedNotifications : notificationContext.notifications;
  const unreadCount = notifications.filter((item) => !item.read).length;
  const markAsRead = onMarkRead || notificationContext.markAsRead;
  const markAllAsRead = onMarkAllRead || notificationContext.markAllAsRead;
  const simulate = notificationContext.simulate;
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openedNotification, setOpenedNotification] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showTestNotifications, setShowTestNotifications] = useState(false);

  useEffect(() => {
    const handleOpenDetail = (e) => {
      const notif = e.detail;
      if (notif) {
        setActiveCategory("All");
        setOpenedNotification(notif);
        if (!notif.read) {
          markAsRead(notif.id);
        }
      }
    };
    window.addEventListener("openNotificationDetail", handleOpenDetail);
    return () => window.removeEventListener("openNotificationDetail", handleOpenDetail);
  }, [markAsRead]);

  // Simulator state
  const [simCategory, setSimCategory] = useState("New Contact Message");
  const [simTitle, setSimTitle] = useState("");
  const [simDesc, setSimDesc] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simTitle.trim() || !simDesc.trim()) return;
    
    setIsSimulating(true);
    try {
      await simulate(simCategory, simTitle.trim(), simDesc.trim());
      setSimTitle("");
      setSimDesc("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleOpenNotification = async (notif) => {
    setOpenedNotification({ ...notif, read: true });
    if (!notif.read) {
      await markAsRead(notif.id);
    }
  };

  const triggerReplySms = (notif) => {
    // Parse contact name or details if possible, or fallback
    const detail = {
      name: notif.title.replace("New Message from ", "").replace("New Lead: ", ""),
      email: "",
      phone: ""
    };
    
    // Dispatch custom event to trigger composer
    const event = new CustomEvent("openSmsComposerForContact", { detail });
    window.dispatchEvent(event);
  };

  const categories = ["All", "New Contact Message", "Support Message", "Lead Generated", "System Alert"];
  const isLikelyTestNotification = (notification) => {
    const source = `${notification?.title || ""} ${notification?.desc || ""}`.toLowerCase();
    return ["test", "demo", "super", "deepika", "certificate", "mailnoav"].some((marker) => source.includes(marker));
  };

  const filtered = notifications
    .filter((n) => {
      if (!n) return false;
      if (!showTestNotifications && isLikelyTestNotification(n)) return false;
      const catMatches = activeCategory === "All" || n.type === activeCategory;
      const title = n.title || "";
      const desc = n.desc || "";
      const searchMatches = 
        title.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase());
      return catMatches && searchMatches;
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  const visibleNotifications = showAllNotifications ? filtered : filtered.slice(0, compactLimit);
  const hiddenTestNotificationCount = notifications.filter(isLikelyTestNotification).length;

  return (
    <div className={`notification-center-container ${theme ? "dark" : "light"}`}>
      {/* Simulation Control Panel */}
      {showSimulator && (
      <div className="sim-panel">
        <div className="sim-header">
          <MdNotificationsActive size={20} className="sim-icon" />
          <h3>Real-time SMS & Alert Simulator</h3>
        </div>
        <form onSubmit={handleSimulate} className="sim-form">
          <div className="form-row">
            <div className="form-group">
              <label>Alert Category</label>
              <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)}>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Message Title / Sender</label>
              <input
                type="text"
                placeholder="e.g. New Message from Priya Menon"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Message Body / Details</label>
            <textarea
              placeholder="e.g. Can you please call me back regarding my campaign statistics? Thanks!"
              value={simDesc}
              onChange={(e) => setSimDesc(e.target.value)}
              rows={2}
              required
            />
          </div>
          <button type="submit" disabled={isSimulating} className="sim-submit-btn">
            {isSimulating ? "Emitting..." : "Trigger Push Alert"}
            <MdSend size={14} style={{ marginLeft: "8px" }} />
          </button>
        </form>
      </div>
      )}

      {/* Main Center */}
      <div className="notifications-main-card">
        <div className="center-header">
          <div className="title-row">
            <h2>{openedNotification ? "Message Detail" : "Notifications"}</h2>
            {unreadCount > 0 && <span className="unread-badge-count">{unreadCount} unread</span>}
          </div>
          {unreadCount > 0 && !openedNotification && (
            <button type="button" className="mark-all-read-btn" onClick={markAllAsRead}>
              <MdDoneAll size={16} style={{ marginRight: "6px" }} />
              Mark all read
            </button>
          )}
          {hiddenTestNotificationCount > 0 && !openedNotification && (
            <button type="button" className="mark-all-read-btn" onClick={() => setShowTestNotifications((current) => !current)}>
              {showTestNotifications ? "Hide test alerts" : `Show ${hiddenTestNotificationCount} test alerts`}
            </button>
          )}
        </div>

        {openedNotification ? (
          <div className="message-detail-view animate-fade-in">
            <button type="button" className="back-btn" onClick={() => setOpenedNotification(null)}>
              <MdArrowBack size={16} style={{ marginRight: "8px" }} />
              Back to notifications
            </button>
            <div className="detail-meta">
              <span 
                className="category-pill" 
                style={{ 
                  backgroundColor: `${categoryColors[openedNotification.type] || "#2563eb"}15`,
                  color: categoryColors[openedNotification.type] || "#2563eb"
                }}
              >
                {openedNotification.type}
              </span>
              <span className="detail-time">{openedNotification.time}</span>
            </div>
            <h3 className="detail-title">{openedNotification.title}</h3>
            <p className="detail-body">{openedNotification.desc}</p>
            
            {/* Context Action Row */}
            {(openedNotification.type === "New Contact Message" || openedNotification.type === "Lead Generated") && (
              <div className="detail-actions">
                <button type="button" className="action-reply-btn" onClick={() => triggerReplySms(openedNotification)}>
                  <MdEmail size={16} style={{ marginRight: "8px" }} />
                  Reply via SMS
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="category-tabs-bar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`tab-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === "All" ? "All Alerts" : cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="search-bar-wrapper">
              <MdSearch size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search alerts by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="notifications-list">
              {filtered.length === 0 ? (
                <div className="empty-notifications">
                  <MdNotificationsActive size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                  <p>No notifications found in this category.</p>
                </div>
              ) : (
                visibleNotifications.map((notif) => {
                  const Icon = categoryIcons[notif.type] || MdSettings;
                  const iconColor = categoryColors[notif.type] || "#2563eb";
                  return (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.read ? "read" : "unread"}`}
                      onClick={() => handleOpenNotification(notif)}
                    >
                      <div className="item-icon-box" style={{ backgroundColor: `${iconColor}12` }}>
                        <Icon size={20} color={iconColor} />
                      </div>
                      <div className="item-content">
                        <div className="item-title-row">
                          <span className="item-title">{notif.title}</span>
                          {!notif.read && <span className="unread-dot" />}
                        </div>
                        <p className="item-desc">{notif.desc}</p>
                      </div>
                      <span className="item-time">{notif.time}</span>
                    </div>
                  );
                })
              )}
            </div>
            {filtered.length > compactLimit && (
              <button
                type="button"
                className="notifications-toggle-btn"
                onClick={() => setShowAllNotifications((current) => !current)}
              >
                {showAllNotifications ? "Show Less" : `Show All (${filtered.length})`}
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        .notification-center-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          font-family: inherit;
        }

        /* Simulator Styles */
        .sim-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid var(--mn-border, #e2e8f0);
          border-radius: 12px;
          padding: 16px;
        }

        .dark-mode .sim-panel {
          background: rgba(30, 41, 59, 0.4);
        }

        .sim-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--mn-border, #e2e8f0);
          padding-bottom: 8px;
        }

        .dark-mode .sim-header {
          border-color: rgba(71, 85, 105, 0.4);
        }

        .sim-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sim-icon {
          color: #3b82f6;
        }

        .sim-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 12px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--mn-border, #e2e8f0);
          background: var(--mn-surface-muted, #f8fafc);
          color: inherit;
          font-size: 13px;
          outline: none;
        }

        .dark-mode .form-group input, .dark-mode .form-group select, .dark-mode .form-group textarea {
          border-color: rgba(71, 85, 105, 0.6);
          background: rgba(15, 23, 42, 0.3);
        }

        .sim-submit-btn {
          align-self: flex-start;
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sim-submit-btn:hover {
          background: #1d4ed8;
        }

        /* Notifications Panel */
        .notifications-main-card {
          display: flex;
          flex-direction: column;
        }

        .center-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-row h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .unread-badge-count {
          font-size: 11px;
          font-weight: 700;
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .mark-all-read-btn {
          background: none;
          border: 1px solid var(--mn-border, #e2e8f0);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: inherit;
        }

        .dark-mode .mark-all-read-btn {
          border-color: rgba(71, 85, 105, 0.6);
        }

        .mark-all-read-btn:hover {
          background: var(--mn-surface-muted, #f8fafc);
        }

        /* Tabs */
        .category-tabs-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tab-btn {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--mn-border, #e2e8f0);
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: inherit;
          transition: all 0.2s;
        }

        .dark-mode .tab-btn {
          border-color: rgba(71, 85, 105, 0.6);
        }

        .tab-btn.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        /* Search */
        .search-bar-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-bar-wrapper input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          border-radius: 8px;
          border: 1px solid var(--mn-border, #e2e8f0);
          background: transparent;
          color: inherit;
          outline: none;
          font-size: 13px;
        }

        .dark-mode .search-bar-wrapper input {
          border-color: rgba(71, 85, 105, 0.6);
        }

        /* List Items */
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notifications-toggle-btn {
          margin-top: 12px;
          width: 100%;
          border: 1px solid var(--mn-border, #e2e8f0);
          background: var(--mn-surface, #ffffff);
          color: var(--mn-text, #0f172a);
          border-radius: 8px;
          padding: 10px 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .notifications-toggle-btn:hover {
          border-color: rgba(15, 118, 110, 0.35);
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid var(--mn-border, #e2e8f0);
          background: var(--mn-surface-muted, #f8fafc);
          transition: all 0.2s;
        }

        .dark-mode .notification-item {
          border-color: rgba(71, 85, 105, 0.4);
          background: rgba(30, 41, 59, 0.2);
        }

        .notification-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .notification-item.unread {
          border-left: 4px solid #2563eb;
          background: rgba(37, 99, 235, 0.03);
        }

        .item-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-content {
          flex: 1;
        }

        .item-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .item-title {
          font-size: 13px;
          font-weight: 700;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
        }

        .item-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .item-time {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .empty-notifications {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        /* Detail View */
        .message-detail-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back-btn {
          align-self: flex-start;
          background: none;
          border: none;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .back-btn:hover {
          background: rgba(37, 99, 235, 0.05);
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .detail-time {
          font-size: 11px;
          color: #94a3b8;
        }

        .detail-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .detail-body {
          font-size: 13px;
          line-height: 1.5;
          color: #475569;
          white-space: pre-wrap;
        }

        .dark-mode .detail-body {
          color: #cbd5e1;
        }

        .detail-actions {
          margin-top: 12px;
          border-top: 1px solid var(--mn-border, #e2e8f0);
          padding-top: 12px;
        }

        .dark-mode .detail-actions {
          border-color: rgba(71, 85, 105, 0.4);
        }

        .action-reply-btn {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-reply-btn:hover {
          background: #1d4ed8;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
