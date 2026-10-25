import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import toast from "react-hot-toast";

const AVATAR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#dc2626",
  "#ea580c",
  "#0891b2",
  "#65a30d",
  "#db2777",
  "#7c3aed",
  "#059669",
];

function Profile() {
  const { user, login, token, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState("#2563eb");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile");
      setProfile(res.data.user);
      setStats(res.data.stats);
      setName(res.data.user.name);
      setAvatarColor(res.data.user.avatarColor || "#2563eb");
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      const res = await api.put("/profile", { name, avatarColor });
      setProfile(res.data.user);
      login(token, { ...user, name, avatarColor });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile?.name || "");
    setAvatarColor(profile?.avatarColor || "#2563eb");
    setEditing(false);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) return toast.error("Enter your password to confirm");
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account", {
        data: { password: deletePassword },
      });
      toast.success("Account deleted");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const initial = (profile?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        Profile
      </h1>

      {/* Avatar + Name Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 mb-6 text-center sm:text-left">
          {/* Avatar */}
          <div
            style={{
              backgroundColor: editing
                ? avatarColor
                : profile?.avatarColor || "#2563eb",
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0"
          >
            {initial}
          </div>
          {/* Info */}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              {profile?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">
              {profile?.email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Member since{" "}
              {new Date(profile?.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar Color
              </label>
              <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform ${
                      avatarColor === color
                        ? "scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500"
                        : "hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium text-sm"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Account Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {stats?.expenses || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Expenses
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.incomes || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Incomes
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.savings || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Savings
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.total || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Account Info
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              Email
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white text-right break-all">
              {profile?.email}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              Email Verified
            </span>
            <span
              className={`text-sm font-medium ${
                profile?.isEmailVerified
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {profile?.isEmailVerified ? "✅ Verified" : "❌ Not Verified"}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              Member Since
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white text-right">
              {new Date(profile?.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              Last Updated
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white text-right">
              {new Date(profile?.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-red-200 dark:border-red-900 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400 mb-1">
          ⚠️ Danger Zone
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Permanently delete your account and all associated data — expenses,
          income, savings, budgets, goals, EMIs, bills, and net worth records.
          This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full border border-red-500 text-red-600 dark:text-red-400 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-sm"
        >
          🗑️ Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            onClick={() => {
              if (!deleting) {
                setShowDeleteModal(false);
                setDeletePassword("");
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 p-6 sm:p-8"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: "12px",
              width: "calc(100% - 2rem)",
              maxWidth: "400px",
              zIndex: 1000,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                marginBottom: "1rem",
              }}
              className="bg-red-100 dark:bg-red-900/30"
            >
              🗑️
            </div>

            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">
              Delete your account?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              This will permanently delete your account and ALL your data —
              expenses, income, savings, budgets, goals, EMIs, bills, and net
              worth history. This cannot be undone.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your password"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                  }}
                  disabled={deleting}
                  className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
