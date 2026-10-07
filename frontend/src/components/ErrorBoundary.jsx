import { Component } from "react";

// Without this, any uncaught error anywhere in the tree (a null reference,
// bad API data, whatever) takes down the entire app to a blank white
// screen with no way back except a hard refresh. This catches it and
// shows a recoverable screen instead.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    // This used to always send people to /dashboard (the user workspace),
    // even when an Admin hit the error on an admin screen - it looked like
    // getting bounced out of the admin panel entirely. Route based on the
    // actual stored role instead.
    let role = null;
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      role = stored?.role || null;
    } catch {
      role = null;
    }
    window.location.href = role === "Admin" ? "/admin" : "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
            fontFamily: "inherit",
            background: "#0f172a",
            color: "#f8fafc",
          }}
        >
          <h1 style={{ fontSize: "22px", margin: 0 }}>Something went wrong</h1>
          <p style={{ maxWidth: "420px", color: "#94a3b8", margin: 0 }}>
            This page hit an unexpected error. Your data is safe - try reloading, or head back to your dashboard.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: "#ea580c",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                background: "transparent",
                color: "#f8fafc",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
