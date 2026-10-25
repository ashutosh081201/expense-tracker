import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Groceries",
  "Fuel",
  "Other",
];

const CATEGORY_EMOJIS = {
  Food: "🍔",
  Travel: "✈️",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Health: "💊",
  Education: "📚",
  Groceries: "🛒",
  Fuel: "⛽",
  Other: "💰",
};

function BudgetProgressBar({ percent, status }) {
  const color =
    status === "exceeded"
      ? "bg-red-500"
      : status === "warning"
        ? "bg-yellow-500"
        : "bg-green-500";

  const bg =
    status === "exceeded"
      ? "bg-red-100 dark:bg-red-900/20"
      : status === "warning"
        ? "bg-yellow-100 dark:bg-yellow-900/20"
        : "bg-green-100 dark:bg-green-900/20";

  return (
    <div className={`h-2 w-full rounded-full ${bg}`}>
      <div
        className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "short", year: "numeric" }),
  );
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState("Food");
  const [formLimit, setFormLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
    );
  }

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budget?month=${selectedMonth}`);
      setBudgets(res.data.budgets);
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!formLimit || parseFloat(formLimit) <= 0) {
      return toast.error("Enter a valid budget amount");
    }
    setSaving(true);
    try {
      await api.post("/budget", {
        category: formCategory,
        limit: parseFloat(formLimit),
        month: selectedMonth,
      });
      toast.success(`Budget set for ${formCategory}!`);
      setShowForm(false);
      setFormLimit("");
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/budget/${deleteId}`);
      toast("Budget removed", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchBudgets();
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const setCategoryHasBudget = new Set(budgets.map((b) => b.category));
  const availableCategories = CATEGORIES.filter(
    (c) => !setCategoryHasBudget.has(c),
  );

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const exceeded = budgets.filter((b) => b.status === "exceeded").length;
  const warning = budgets.filter((b) => b.status === "warning").length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          💳 Budget
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none min-w-0"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {availableCategories.length > 0 && (
            <button
              onClick={() => {
                setFormCategory(availableCategories[0]);
                setShowForm(!showForm);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm whitespace-nowrap"
            >
              {showForm ? "Cancel" : "+ Set Budget"}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Total Budget
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              ₹{totalLimit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Total Spent
            </p>
            <p
              className={`text-lg sm:text-xl font-bold ${
                totalSpent > totalLimit
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Remaining
            </p>
            <p
              className={`text-lg sm:text-xl font-bold ${
                totalLimit - totalSpent >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {totalLimit - totalSpent >= 0 ? "" : "-"}₹
              {Math.abs(totalLimit - totalSpent).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Alerts
            </p>
            <p className="text-base sm:text-xl font-bold">
              {exceeded > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {exceeded} 🔴
                </span>
              )}
              {warning > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                  {warning} 🟡
                </span>
              )}
              {exceeded === 0 && warning === 0 && (
                <span className="text-green-600 dark:text-green-400 text-sm sm:text-xl">
                  All good ✅
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Set Budget Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Set Budget for {selectedMonth}
          </h2>
          <form onSubmit={handleSetBudget} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${
                      formCategory === cat
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{CATEGORY_EMOJIS[cat]}</span>
                    <span className="text-center leading-tight">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Limit (₹)
              </label>
              <input
                type="number"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g. 5000"
                min="1"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : "Set Budget"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormLimit("");
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-8 sm:p-12 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            No budgets set for {selectedMonth}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set a budget to track your spending limits
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets
            .sort((a, b) => b.percent - a.percent)
            .map((budget) => (
              <div
                key={budget._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
                        budget.status === "exceeded"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : budget.status === "warning"
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {CATEGORY_EMOJIS[budget.category]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
                        {budget.category}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        ₹{budget.spent.toLocaleString()} of ₹
                        {budget.limit.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        budget.status === "exceeded"
                          ? "text-red-600 dark:text-red-400"
                          : budget.status === "warning"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {budget.percent}%
                    </span>
                    <span className="text-sm hidden sm:inline">
                      {budget.status === "exceeded"
                        ? "🔴"
                        : budget.status === "warning"
                          ? "🟡"
                          : "🟢"}
                    </span>
                    <button
                      onClick={() => {
                        setDeleteId(budget._id);
                        setConfirmOpen(true);
                      }}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <BudgetProgressBar
                  percent={budget.percent}
                  status={budget.status}
                />

                {budget.status === "exceeded" && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ⚠️ Over budget by ₹
                    {(budget.spent - budget.limit).toLocaleString()}
                  </p>
                )}
                {budget.status === "warning" && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    ⚠️ {100 - budget.percent}% remaining — approaching limit
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Budget?"
        message="This budget limit will be removed. Your expenses won't be affected."
        confirmLabel="Remove"
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

export default Budget;
