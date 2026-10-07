import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout.jsx";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState(null);

  const startResendTimer = () => {
    setResendTimer(30);

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    if (e.target.name === "confirmPassword" || e.target.name === "password") {
      const pwd = e.target.name === "password" ? e.target.value : updated.password;
      const confirmPwd = e.target.name === "confirmPassword" ? e.target.value : updated.confirmPassword;
      if (confirmPwd && pwd !== confirmPwd) {
        setPasswordError("Passwords do not match");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/register-otp", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (response.data.success) {
        setStep("otp");
        if (response.data.devOtp) {
          setOtp(response.data.devOtp);
        }
        startResendTimer();
        setMessage({
          type: "success",
          text: response.data.devOtp
            ? `${response.data.message || "OTP generated."} (Demo OTP auto-filled)`
            : response.data.message || "OTP sent to your email. Please verify."
        });
      } else {
        setMessage({ type: "error", text: response.data.message || "Failed to send verification OTP." });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        otp,
      });
      if (response.data.success) {
        navigate("/login");
      } else {
        setMessage({ type: "error", text: response.data.message || "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setMessage(null);
    setLoading(true);
    try {
      const response = await API.post("/auth/register-otp", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (response.data.devOtp) {
        setOtp(response.data.devOtp);
      }
      setMessage({
        type: "success",
        text: response.data.devOtp
          ? `${response.data.message || "Verification code regenerated."} (Demo OTP auto-filled)`
          : response.data.message || "Verification code resent successfully."
      });
      startResendTimer();
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Error resending OTP." });
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

      <div className="tabs">
        <Link to="/login">
          <button>Login</button>
        </Link>
        <button className="active-tab">Register</button>
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

      {step === "credentials" ? (
        <>
          <h1 className="welcome-title">Create Account</h1>

          <form onSubmit={handleCredentialsSubmit}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              style={{ borderColor: passwordError ? "#e74c3c" : "" }}
            />

            {passwordError && (
              <p style={{ color: "#e74c3c", fontSize: "13px", marginTop: "6px" }}>
                {passwordError}
              </p>
            )}

            <button className="submit-btn" disabled={loading || !!passwordError}>
              {loading ? "Sending OTP..." : "Register"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="welcome-title">Verify Email</h1>
          <p className="subtitle">
            An OTP code has been generated for <strong>{form.email}</strong>. Enter it below to complete registration.
          </p>

          <form onSubmit={handleOtpSubmit}>
            <label>Enter OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              maxLength={6}
              required
              style={{
                letterSpacing: "6px",
                fontSize: "20px",
                textAlign: "center",
              }}
            />

            <button
              className="submit-btn"
              disabled={loading || otp.length < 6}
            >
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>
          </form>

          <p className="footer-text" style={{ marginTop: "15px" }}>
            Didn't get the OTP?{" "}
            {resendTimer > 0 ? (
              <span style={{ color: "gray" }}>Resend in {resendTimer}s</span>
            ) : (
              <span
                onClick={handleResendOtp}
                style={{ color: "orange", cursor: "pointer", fontWeight: "bold" }}
              >
                Resend OTP
              </span>
            )}
          </p>

          <p className="footer-text">
            <span
              onClick={() => {
                setStep("credentials");
                setOtp("");
              }}
              style={{ color: "orange", cursor: "pointer" }}
            >
              ← Edit details
            </span>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

export default Register;
