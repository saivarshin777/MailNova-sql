import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import API from "../services/api";
import AuthLayout from "../components/AuthLayout.jsx";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (confirmPassword && val !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (password && val !== password) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post(
        `/auth/reset-password/${token}`,
        { password }
      );

      setMessage({
        type: "success",
        text: response.data.message || "Password updated successfully! Redirecting you to login..."
      });

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not update password. The link may have expired."
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
        <h1 className="welcome-title">Reset Password</h1>
        <p className="subtitle">
          Choose a strong, secure new password for your MailNova account.
        </p>
      </div>

      {message && (
        <div className={`auth-alert auth-alert-${message.type}`}>
          <div className="auth-alert-icon">
            {message.type === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
          </div>
          <div className="auth-alert-content">{message.text}</div>
          {message.type === "error" && (
            <button 
              type="button" 
              className="auth-alert-close"
              onClick={() => setMessage(null)}
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={handlePasswordChange}
          required
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
          style={{ borderColor: passwordError ? "#e74c3c" : "" }}
        />

        {passwordError && (
          <p style={{ color: "#e74c3c", fontSize: "13px", marginTop: "6px" }}>
            {passwordError}
          </p>
        )}

        <button className="submit-btn" disabled={loading || !!passwordError}>
          {loading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
