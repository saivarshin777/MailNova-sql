import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import API from "../services/api";
import AuthLayout from "../components/AuthLayout.jsx";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await API.post("/auth/forgot-password", {
        email,
      });
      setMessage({
        type: "success",
        text: response.data.message || "A reset link has been sent to your email."
      });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not send reset link. Please check the email address."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="logo-section">
        <div className="logo-box">MN</div>
        <div>
          <h2>
            <span className="mail-text">Mail </span>
            <span className="nova-text">Nova</span>
          </h2>
          <p>Smart Mail. Secure Access.</p>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h1 className="welcome-title">Forgot Password</h1>
        <p className="subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {message && (
        <div className={`auth-alert auth-alert-${message.type}`}>
          <div className="auth-alert-icon">
            {message.type === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
          </div>
          <div className="auth-alert-content">{message.text}</div>
          <button 
            type="button" 
            className="auth-alert-close"
            onClick={() => setMessage(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Email Address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="submit-btn" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="footer-text" style={{ marginTop: "20px" }}>
        <Link to="/login" style={{ color: "orange", textDecoration: "none", fontWeight: "bold" }}>
          ← Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
