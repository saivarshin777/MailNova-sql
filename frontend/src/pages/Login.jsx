import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout.jsx";
import API from "../services/api";
import { getHomeRoute } from "../utils/auth.js";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sessionExpired")) {
      setMessage({ type: "error", text: "Your session expired. Please sign in again." });
      window.history.replaceState({}, "", "/login");
    }
  }, []);

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

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });
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
        setMessage({ type: "error", text: response.data.message || "Invalid credentials." });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await API.post("/auth/verify-otp", { email, otp });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate(getHomeRoute(response.data.user?.role));
      } else {
        setMessage({ type: "error", text: response.data.message || "Invalid OTP. Please try again." });
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
      const response = await API.post("/auth/resend-otp", { email });
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
            <span className="mail-text">
              Mail{" "}
            </span>

            <span className="nova-text">
              Nova
            </span>
          </h2>

          <p>
            Smart Mail. Secure Access.
          </p>
        </div>
      </div>

      <div className="tabs">
        <button className="active-tab">
          Login
        </button>

        <Link to="/register">
          <button>Register</button>
        </Link>
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
          <h1 className="welcome-title">
            Welcome back
          </h1>

          <p className="subtitle">
            Sign in to continue to your
            MailNova workspace.
          </p>

          <form
            onSubmit={
              handleCredentialsSubmit
            }
          >
            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <div className="options">
              <div>
                <input type="checkbox" />{" "}
                Remember me
              </div>

              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? "Checking..."
                : "Next Step"}
            </button>
          </form>

        </>
      ) : (
        <>
          <h1 className="welcome-title">
            Verify Your Email
          </h1>

          <p className="subtitle">
            An OTP has been generated
            for <strong>{email}</strong>.
            Enter it below.
          </p>

          <form
            onSubmit={handleOtpSubmit}
          >
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
              disabled={
                loading ||
                otp.length < 6
              }
            >
              {loading
                ? "Verifying..."
                : "Verify & Login"}
            </button>
          </form>

          <p
            className="footer-text"
            style={{
              marginTop: "15px",
            }}
          >
            Didn't get the OTP?{" "}
            {resendTimer > 0 ? (
              <span
                style={{
                  color: "gray",
                }}
              >
                Resend in{" "}
                {resendTimer}s
              </span>
            ) : (
              <span
                onClick={
                  handleResendOtp
                }
                style={{
                  color: "orange",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Resend OTP
              </span>
            )}
          </p>

          <p className="footer-text">
            <span
              onClick={() => {
                setStep(
                  "credentials"
                );
                setOtp("");
              }}
              style={{
                color: "orange",
                cursor: "pointer",
              }}
            >
              ← Change email /
              password
            </span>
          </p>
        </>
      )}

      <p className="footer-text">
        Secure email authentication
        powered by MailNova.
      </p>
    </AuthLayout>
  );
}

export default Login;
