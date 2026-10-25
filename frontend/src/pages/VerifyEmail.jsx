import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import api from "../api/axios";

function VerifyEmail() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, otp });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    try {
      await api.post("/auth/resend-otp", { email, type: "email-verify" });
      setMessage("New OTP sent to your email");
      setCountdown(60);
      setCanResend(false);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200 relative px-4 py-8">
      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg shadow hover:shadow-md transition"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-transparent dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3 shadow-md">
            <span className="text-2xl">📧</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Verify your email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We sent a 6-digit OTP to
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5 break-all px-2">
            {email}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded mb-4 text-sm border border-green-200 dark:border-green-800">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl sm:text-2xl font-bold tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="text-center mt-4">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Resend OTP in{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {countdown}s
              </span>
            </p>
          )}
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Back to Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
