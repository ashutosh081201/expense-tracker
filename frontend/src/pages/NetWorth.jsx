import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const ASSET_CATEGORIES = [
  "Cash",
  "Savings Account",
  "Fixed Deposit",
  "Stocks",
  "Mutual Funds",
  "Gold",
  "Real Estate",
  "Vehicle",
  "Crypto",
  "Other",
];

const LIABILITY_CATEGORIES = [
  "Home Loan",
  "Car Loan",
  "Personal Loan",
  "Education Loan",
  "Credit Card Debt",
  "Other",
];

const ASSET_EMOJIS = {
  Cash: "💵",
  "Savings Account": "🏦",
  "Fixed Deposit": "🔒",
  Stocks: "📈",
  "Mutual Funds": "📊",
  Gold: "🥇",
  "Real Estate": "🏠",
  Vehicle: "🚗",
  Crypto: "₿",
  Other: "💰",
};

const LIABILITY_EMOJIS = {
  "Home Loan": "🏠",
  "Car Loan": "🚗",
  "Personal Loan": "💰",
  "Education Loan": "📚",
  "Credit Card Debt": "💳",
  Other: "📄",
};

function NetWorth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("asset");
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [formData, setFormData] = useState({
    name: "",
    value: "",
    type: "asset",
    category: "Cash",
  });

  useEffect(() => {
    fetchNetWorth();
  }, []);

  const fetchNetWorth = async () => {
    try {
      const res = await api.get("/networth");
      setData(res.data);
    } catch {
      toast.error("Failed to load net worth data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/networth/${editData._id}`, formData);
        toast("Entry updated!", {
          icon: "✏️",
          style: {
            background: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #93c5fd",
            borderRadius: "8px",
            fontSize: "0.9rem",
          },
        });
      } else {
        await api.post("/networth", formData);
        toast.success(`${formType === "asset" ? "Asset" : "Liability"} added!`);
      }
      setShowForm(false);
      setEditData(null);
      setFormData({ name: "", value: "", type: "asset", category: "Cash" });
      fetchNetWorth();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditData(entry);
    setFormType(entry.type);
    setFormData({
      name: entry.name,
      value: entry.value,
      type: entry.type,
      category: entry.category,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/networth/${deleteId}`);
      toast("Entry deleted", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchNetWorth();
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const openAddForm = (type) => {
    setEditData(null);
    setFormType(type);
    setFormData({
      name: "",
      value: "",
      type,
      category: type === "asset" ? "Cash" : "Home Loan",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const netWorth = data?.netWorth || 0;
  const totalAssets = data?.totalAssets || 0;
  const totalLiabilities = data?.totalLiabilities || 0;
  const netWorthPositive = netWorth >= 0;

  const allAssets = [
    ...(data?.breakdown?.autoAssets || []),
    ...(data?.breakdown?.manualAssets || []),
  ];
  const allLiabilities = [
    ...(data?.breakdown?.autoLiabilities || []),
    ...(data?.breakdown?.manualLiabilities || []),
  ];

  const assetPct =
    totalAssets + totalLiabilities > 0
      ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)
      : 100;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          📈 Net Worth
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => openAddForm("asset")}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded transition text-sm font-medium flex-1 sm:flex-none"
          >
            + Asset
          </button>
          <button
            onClick={() => openAddForm("liability")}
            className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded transition text-sm font-medium flex-1 sm:flex-none"
          >
            + Liability
          </button>
        </div>
      </div>

      {/* Net Worth Hero Card */}
      <div
        style={{
          background: netWorthPositive
            ? "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
            : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          borderRadius: "16px",
          padding: "1.75rem 1.25rem",
          marginBottom: "1.5rem",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
        className="sm:!p-10"
      >
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "0.6rem",
            fontWeight: "500",
          }}
          className="sm:!text-xs"
        >
          Total Net Worth
        </p>
        <p
          style={{
            color: "white",
            fontWeight: "800",
            marginBottom: "0.6rem",
            lineHeight: 1,
          }}
          className="!text-3xl sm:!text-5xl"
        >
          {netWorthPositive ? "" : "-"}₹{Math.abs(netWorth).toLocaleString()}
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
          }}
          className="!text-xs sm:!text-sm"
        >
          {netWorthPositive
            ? "Your assets exceed your liabilities ✅"
            : "Your liabilities exceed your assets ⚠️"}
        </p>
      </div>

      {/* Assets vs Liabilities Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow border border-transparent dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📦</span>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Assets
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{totalAssets.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {allAssets.length} {allAssets.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow border border-transparent dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📉</span>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Liabilities
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
            ₹{totalLiabilities.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {allLiabilities.length}{" "}
            {allLiabilities.length === 1 ? "entry" : "entries"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalAssets + totalLiabilities > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-green-600 dark:text-green-400 font-medium">
              Assets {assetPct}%
            </span>
            <span className="hidden sm:inline text-gray-500 dark:text-gray-400">
              Assets vs Liabilities
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              Liabilities {100 - assetPct}%
            </span>
          </div>
          <div
            style={{
              height: "16px",
              borderRadius: "9999px",
              overflow: "hidden",
              background: "#fee2e2",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${assetPct}%`,
                height: "100%",
                background: "#22c55e",
                borderRadius: "9999px 0 0 9999px",
                transition: "width 0.7s ease",
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-400 dark:text-gray-500">
            <span>₹{totalAssets.toLocaleString()}</span>
            <span>₹{totalLiabilities.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData
              ? "Edit Entry"
              : formType === "asset"
                ? "+ Add Asset"
                : "+ Add Liability"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editData && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("asset");
                    setFormData((p) => ({
                      ...p,
                      type: "asset",
                      category: "Cash",
                    }));
                  }}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                    formType === "asset"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  📦 Asset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("liability");
                    setFormData((p) => ({
                      ...p,
                      type: "liability",
                      category: "Home Loan",
                    }));
                  }}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                    formType === "liability"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  📉 Liability
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder={
                    formType === "asset"
                      ? "e.g. HDFC Savings Account"
                      : "e.g. Home Loan - SBI"
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 100000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(formType === "asset"
                  ? ASSET_CATEGORIES
                  : LIABILITY_CATEGORIES
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${
                      formData.category === cat
                        ? formType === "asset"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">
                      {formType === "asset"
                        ? ASSET_EMOJIS[cat]
                        : LIABILITY_EMOJIS[cat]}
                    </span>
                    <span className="text-center leading-tight">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 text-white py-2 rounded transition disabled:opacity-50 font-medium ${
                  formType === "asset"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving
                  ? "Saving..."
                  : editData
                    ? "Update"
                    : formType === "asset"
                      ? "Add Asset"
                      : "Add Liability"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditData(null);
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "assets", label: "📦 Assets" },
          { key: "liabilities", label: "📉 Liabilities" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Assets Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
              📦 Assets Breakdown
            </h3>
            {allAssets.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No assets yet. Click + Asset to add.
              </p>
            ) : (
              <div className="space-y-4">
                {allAssets.map((asset, idx) => {
                  const pct =
                    totalAssets > 0
                      ? Math.round((asset.value / totalAssets) * 100)
                      : 0;
                  return (
                    <div key={asset._id || idx}>
                      <div className="flex justify-between items-center mb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{ASSET_EMOJIS[asset.category] || "💰"}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {asset.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                            ₹{asset.value.toLocaleString()} ({pct}%)
                          </span>
                          {!asset.auto && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(asset)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteId(asset._id);
                                  setConfirmOpen(true);
                                }}
                                className="text-gray-400 hover:text-red-500 text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          height: "8px",
                          borderRadius: "9999px",
                          overflow: "hidden",
                          background: "#f1f5f9",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#22c55e",
                            borderRadius: "9999px",
                            transition: "width 0.7s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Liabilities Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
              📉 Liabilities Breakdown
            </h3>
            {allLiabilities.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No liabilities. Great! 🎉
              </p>
            ) : (
              <div className="space-y-4">
                {allLiabilities.map((liability, idx) => {
                  const pct =
                    totalLiabilities > 0
                      ? Math.round((liability.value / totalLiabilities) * 100)
                      : 0;
                  return (
                    <div key={liability._id || idx}>
                      <div className="flex justify-between items-center mb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>
                            {LIABILITY_EMOJIS[liability.category] || "📄"}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {liability.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                            ₹{liability.value.toLocaleString()} ({pct}%)
                          </span>
                          {!liability.auto && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(liability)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteId(liability._id);
                                  setConfirmOpen(true);
                                }}
                                className="text-gray-400 hover:text-red-500 text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          height: "8px",
                          borderRadius: "9999px",
                          overflow: "hidden",
                          background: "#f1f5f9",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#ef4444",
                            borderRadius: "9999px",
                            transition: "width 0.7s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
          {allAssets.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No assets yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click + Asset to add your first asset
              </p>
            </div>
          ) : (
            allAssets.map((asset, idx) => (
              <div
                key={asset._id || idx}
                className={`flex items-center justify-between p-3 sm:p-4 gap-2 ${
                  idx !== allAssets.length - 1
                    ? "border-b border-gray-100 dark:border-gray-700"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    {ASSET_EMOJIS[asset.category] || "💰"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                      {asset.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {asset.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <p className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base">
                    ₹{asset.value.toLocaleString()}
                  </p>
                  {!asset.auto && (
                    <>
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(asset._id);
                          setConfirmOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Liabilities Tab */}
      {activeTab === "liabilities" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
          {allLiabilities.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No liabilities!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You have no outstanding liabilities
              </p>
            </div>
          ) : (
            allLiabilities.map((liability, idx) => (
              <div
                key={liability._id || idx}
                className={`flex items-center justify-between p-3 sm:p-4 gap-2 ${
                  idx !== allLiabilities.length - 1
                    ? "border-b border-gray-100 dark:border-gray-700"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    {LIABILITY_EMOJIS[liability.category] || "📄"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                      {liability.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {liability.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">
                    ₹{liability.value.toLocaleString()}
                  </p>
                  {!liability.auto && (
                    <>
                      <button
                        onClick={() => handleEdit(liability)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(liability._id);
                          setConfirmOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Entry?"
        message="This entry will be permanently deleted from your net worth calculation."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

export default NetWorth;
