import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import UserWorkspaceDashboard from "./pages/UserWorkspaceDashboard";
import { getHomeRoute, getStoredUser } from "./utils/auth.js";
import { NotificationProvider } from "./context/NotificationContext";

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
}

function RoleRedirect() {
  const user = getStoredUser();
  const token = localStorage.getItem("token");
  // A mistyped or stale URL used to always bounce here to /login, which
  // looks like getting logged out even when the session is still valid.
  // Send logged-in users back to their real home instead.
  if (token && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

function RouteTransitionLayer() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 220);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return visible ? (
    <div className="route-transition-layer" aria-live="polite" aria-label="Loading page">
      <div className="route-transition-card">
        <span>MN</span>
        <strong>Loading MailNova</strong>
      </div>
    </div>
  ) : null;
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <RouteTransitionLayer />
        <Routes>
          <Route
            path="/"
            element={<RoleRedirect />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin", "User"]}>
                <UserWorkspaceDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<RoleRedirect />}
          />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
