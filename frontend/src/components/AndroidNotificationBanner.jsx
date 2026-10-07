import { useEffect, useState } from "react";
import { FaTimes, FaCheck, FaBell } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";

export function AndroidNotificationItem({ banner }) {
  const { markAsRead, dismissBanner } = useNotifications();
  const [isExiting, setIsExiting] = useState(false);

  // Auto-hide after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissBanner(banner.id);
    }, 350); // wait for slide-up animation
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      markAsRead(banner.id);
    }, 350);
  };

  // Convert time formatting cleanly
  const displayTime = () => {
    if (banner.time && banner.time.includes(",")) {
      // If full date string, extract time
      const parts = banner.time.split(" ");
      return parts[parts.length - 2] + " " + parts[parts.length - 1];
    }
    return banner.time || "Just now";
  };

  // Maps categories to display headers and icons
  const getCategoryTheme = () => {
    switch (banner.type) {
      case "New Contact Message":
        return { label: "INCOMING CONTACT", color: "#2563eb" };
      case "Support Message":
        return { label: "SUPPORT INQUIRY", color: "#0d9488" };
      case "Lead Generated":
        return { label: "LEAD GENERATED", color: "#16a34a" };
      case "System Alert":
        return { label: "SYSTEM ALERT", color: "#dc2626" };
      default:
        return { label: "NOTIFICATION", color: "#2563eb" };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div
      className={`android-sms-banner ${isExiting ? "exit" : "enter"}`}
      onClick={() => {
        // Open the related notification section in the dashboard
        // We will trigger a click/navigate or event
        const notifClickEvent = new CustomEvent("openNotificationDetail", {
          detail: banner,
        });
        window.dispatchEvent(notifClickEvent);
        handleClose();
      }}
    >
      {/* Android Top Accent Header */}
      <div className="sms-banner-header" style={{ borderTop: `4px solid ${theme.color}` }}>
        <div className="sms-header-left">
          <div className="app-icon-badge" style={{ backgroundColor: theme.color }}>
            <FaBell size={10} color="#ffffff" />
          </div>
          <span className="app-title">MailNova</span>
          <span className="divider-dot">•</span>
          <span className="sms-time">{displayTime()}</span>
        </div>
        <button
          type="button"
          className="sms-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <FaTimes size={12} />
        </button>
      </div>

      {/* Main SMS Body */}
      <div className="sms-banner-body">
        <h4 className="sms-sender">{banner.title}</h4>
        <p className="sms-preview">{banner.desc}</p>
      </div>

      {/* Android SMS Action Button */}
      <div className="sms-banner-actions">
        <button type="button" className="sms-action-btn primary" onClick={handleMarkRead}>
          <FaCheck size={10} style={{ marginRight: "6px" }} />
          Mark as Read
        </button>
      </div>
    </div>
  );
}

export default function AndroidNotificationStack() {
  const { activeBanners } = useNotifications();

  return (
    <div className="android-banner-stack-container">
      {activeBanners.map((banner) => (
        <AndroidNotificationItem key={banner.id} banner={banner} />
      ))}

      {/* Global CSS Styles for Android SMS Banners */}
      <style>{`
        .android-banner-stack-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 360px;
          max-width: calc(100vw - 40px);
          pointer-events: none;
        }

        .android-sms-banner {
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 
                      0 8px 16px -6px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                      opacity 0.3s ease;
          cursor: pointer;
        }

        /* Dark mode overrides automatically if dark-mode class is on body/parent */
        .dark-mode .android-sms-banner {
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(71, 85, 105, 0.6);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 
                      0 8px 16px -6px rgba(0, 0, 0, 0.2);
        }

        /* Animations */
        .android-sms-banner.enter {
          animation: smsSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .android-sms-banner.exit {
          animation: smsSlideUp 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }

        .sms-banner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(248, 250, 252, 0.6);
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
        }

        .dark-mode .sms-banner-header {
          background: rgba(15, 23, 42, 0.4);
          border-bottom: 1px solid rgba(51, 65, 85, 0.4);
        }

        .sms-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .app-icon-badge {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .app-title {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dark-mode .app-title {
          color: #94a3b8;
        }

        .divider-dot {
          color: #94a3b8;
          font-size: 10px;
        }

        .sms-time {
          font-size: 11px;
          color: #64748b;
        }

        .dark-mode .sms-time {
          color: #64748b;
        }

        .sms-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }

        .sms-close-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #475569;
        }

        .dark-mode .sms-close-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .sms-banner-body {
          padding: 12px 14px;
        }

        .sms-sender {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px 0;
        }

        .dark-mode .sms-sender {
          color: #f8fafc;
        }

        .sms-preview {
          font-size: 12px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dark-mode .sms-preview {
          color: #cbd5e1;
        }

        .sms-banner-actions {
          display: flex;
          justify-content: flex-end;
          padding: 0 14px 10px 14px;
        }

        .sms-action-btn {
          background: rgba(37, 99, 235, 0.06);
          border: 1px solid rgba(37, 99, 235, 0.15);
          color: #2563eb;
          font-size: 11px;
          font-weight: 600;
          border-radius: 8px;
          padding: 5px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .sms-action-btn:hover {
          background: #2563eb;
          color: #ffffff;
        }

        .dark-mode .sms-action-btn {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: #60a5fa;
        }

        .dark-mode .sms-action-btn:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        @keyframes smsSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes smsSlideUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }

        @media (max-width: 480px) {
          .android-banner-stack-container {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
