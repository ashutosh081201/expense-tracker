import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";

function ChangePassword() {
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-change-password-otp");
      setMessage("OTP sent to your registered email");
      setStep(2);
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Enter 6 digit OTP");
    setStep(3);
    setMessage("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) return setError("Passwords do not match");
    if (newPassword.length < 6)
      return setError("Password must be at least 6 characters");
    if (newPassword === currentPassword)
      return setError("New password cannot be same as current");
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        otp,
        newPassword,
      });
      setMessage("Password changed successfully! Logging out...");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
      if (err.response?.data?.message?.includes("OTP")) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    try {
      await api.post("/auth/send-change-password-otp");
      setMessage("New OTP sent");
      setOtp("");
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    }
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200 relative px-4 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-transparent dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3 shadow-md">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Change Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 px-2">
            {step === 1 && "Enter your current password to continue"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Enter your new password"}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-6 sm:w-8 h-0.5 ${
                    step > s ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
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

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter current password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
            >
              {loading ? "Sending OTP..." : "Send OTP to Email"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
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
                Check your registered email
              </p>
            </div>
            <button
              type="submit"
              disabled={otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
            >
              Verify OTP
            </button>
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Resend in{" "}
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {countdown}s
                  </span>
                </p>
              )}
            </div>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="Re-enter new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
