import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { dashboardApi } from "../services/api";
import { getStoredUser } from "../utils/auth";
import AndroidNotificationStack from "../components/AndroidNotificationBanner";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBanners, setActiveBanners] = useState([]);
  const [socket, setSocket] = useState(null);

  // Play a soft, clean banking SMS-style "ding-ding" chime using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const playTone = (freq, time, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.00001, time + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = audioCtx.currentTime;
      playTone(587.33, now, 0.12); // D5
      playTone(880.00, now + 0.1, 0.25); // A5
    } catch (error) {
      console.warn("Chime audio playback prevented or failed:", error);
    }
  }, []);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Fetch initial notifications
  const loadNotifications = useCallback(async () => {
    const user = getStoredUser();
    if (!user) return;
    try {
      const response = await dashboardApi.getNotifications();
      const list = response.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await dashboardApi.markNotificationRead(id);
      const list = response.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
      
      // Dismiss in-app banner if active
      setActiveBanners((current) => current.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await dashboardApi.markAllNotificationsRead();
      const list = response.data || [];
      setNotifications(list);
      setUnreadCount(0);
      setActiveBanners([]);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  // Simulate an incoming notification
  const simulate = useCallback(async (category, title, desc) => {
    try {
      await dashboardApi.simulateNotification({ category, title, desc });
      // The socket event will trigger the display and sound automatically
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  }, []);

  // Dismiss a banner
  const dismissBanner = useCallback((id) => {
    setActiveBanners((current) => current.filter((banner) => banner.id !== id));
  }, []);

  // Trigger HTML5 Desktop Notification fallback
  const triggerHTML5Notification = useCallback((notif) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      // Only show desktop notice if document is unfocused
      if (document.hidden) {
        new Notification(notif.title, {
          body: notif.desc,
          icon: "/favicon.ico", // fallback placeholder
        });
      }
    }
  }, []);

  // Socket Connection setup
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const socketHost = apiBase.replace("/api", "");

    const newSocket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to server");
      newSocket.emit("join", user._id);
    });

    newSocket.on("notification", (notif) => {
      console.log("[Socket] Real-time notification received:", notif);
      
      // Update lists
      setNotifications((current) => {
        const exists = current.some((item) => item.id === notif.id);
        if (exists) return current;
        return [notif, ...current];
      });
      setUnreadCount((count) => count + 1);

      // Add to alert banner queue
      setActiveBanners((current) => {
        // Keep stack clean, display max 3 simultaneous alerts
        return [...current, notif].slice(-3);
      });

      // Play programmatic alert sound
      playNotificationSound();

      // Show HTML5 desktop alert if page is in background
      triggerHTML5Notification(notif);
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
    });

    setSocket(newSocket);
    loadNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [loadNotifications, playNotificationSound, triggerHTML5Notification]);

  // Keep loading notifications updated when tab gets focus
  useEffect(() => {
    const handleFocus = () => {
      loadNotifications();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanners,
        markAsRead,
        markAllAsRead,
        simulate,
        dismissBanner,
        playNotificationSound,
        loadNotifications,
      }}
    >
      {children}
      <AndroidNotificationStack />
    </NotificationContext.Provider>
  );
};
