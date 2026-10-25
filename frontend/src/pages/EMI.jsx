import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORY_EMOJIS = {
  "Home Loan": "🏠",
  "Car Loan": "🚗",
  "Personal Loan": "💰",
  "Education Loan": "📚",
  "Credit Card": "💳",
  Other: "📄",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

function EMICard({ emi, onMarkPaid, onEdit, onDelete }) {
  const percent = Math.round((emi.paidMonths / emi.tenureMonths) * 100);
  const remaining = emi.tenureMonths - emi.paidMonths;
  const amountLeft = remaining * emi.emiAmount;
  const isCompleted = !emi.isActive || emi.paidMonths >= emi.tenureMonths;

  const nextDue = new Date(emi.startDate);
  nextDue.setMonth(nextDue.getMonth() + emi.paidMonths);
  const nextDueStr = nextDue.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueCopy = new Date(nextDue);
  dueCopy.setHours(0, 0, 0, 0);
  const canPay = dueCopy <= today;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border p-4 sm:p-5 transition ${
        isCompleted
          ? "border-green-300 dark:border-green-700"
          : "border-transparent dark:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
              isCompleted
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-blue-100 dark:bg-blue-900/30"
            }`}
          >
            {CATEGORY_EMOJIS[emi.category]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
                {emi.name}
              </p>
              {isCompleted && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  ✅ Paid Off
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {emi.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(emi)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(emi)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          ₹{emi.emiAmount.toLocaleString()}
          <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
            /month
          </span>
        </span>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Total: ₹{emi.totalAmount.toLocaleString()}
        </span>
      </div>

      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${
            isCompleted ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {emi.paidMonths}
          </span>
          /{emi.tenureMonths} months paid
        </span>
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {percent}%
        </span>
        {!isCompleted && <span>₹{amountLeft.toLocaleString()} left</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {!isCompleted && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">Next Due</p>
            <p
              className={`text-xs font-medium ${
                canPay
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {nextDueStr}
            </p>
          </div>
        )}
        {emi.interestRate > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Interest Rate
            </p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {emi.interestRate}% p.a.
            </p>
          </div>
        )}
        {!isCompleted && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Remaining
            </p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {remaining} months
            </p>
          </div>
        )}
      </div>

      {emi.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3">
          {emi.notes}
        </p>
      )}

      {!isCompleted && (
        <button
          onClick={() => onMarkPaid(emi._id)}
          disabled={!canPay}
          className={`w-full py-2 rounded transition text-sm font-medium ${
            canPay
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {canPay
            ? "✅ Mark This Month Paid"
            : `Due on ${dueCopy.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}`}
        </button>
      )}
    </div>
  );
}

function EMIPage() {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const [checkingLinked, setCheckingLinked] = useState(false);
  const [filter, setFilter] = useState("active");

  const [formData, setFormData] = useState({
    name: "",
    totalAmount: "",
    emiAmount: "",
    interestRate: "",
    tenureMonths: "",
    startDate: new Date().toISOString().split("T")[0],
    category: "Other",
    notes: "",
  });

  useEffect(() => {
    fetchEMIs();
  }, []);

  const fetchEMIs = async () => {
    try {
      const res = await api.get("/emi");
      setEmis(res.data);
    } catch {
      toast.error("Failed to load EMIs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/emi/${editData._id}`, formData);
        toast("EMI updated!", {
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
        await api.post("/emi", formData);
        toast.success("EMI added!");
      }
      setShowForm(false);
      setEditData(null);
      setFormData({
        name: "",
        totalAmount: "",
        emiAmount: "",
        interestRate: "",
        tenureMonths: "",
        startDate: new Date().toISOString().split("T")[0],
        category: "Other",
        notes: "",
      });
      fetchEMIs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save EMI");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (emi) => {
    setEditData(emi);
    setFormData({
      name: emi.name,
      totalAmount: emi.totalAmount,
      emiAmount: emi.emiAmount,
      interestRate: emi.interestRate || "",
      tenureMonths: emi.tenureMonths,
      startDate: emi.startDate.split("T")[0],
      category: emi.category,
      notes: emi.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await api.put(`/emi/${id}/paid`);
      toast.success(
        `EMI marked as paid! ₹${res.data.expense.amount.toLocaleString()} added to Expenses.`,
      );
      fetchEMIs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark paid");
    }
  };

  // Before showing the delete confirmation, check if this EMI
  // has any auto-created Expense entries linked to it, so the
  // user is warned with real numbers before deciding.
  const handleDeleteClick = async (emi) => {
    setDeleteTarget(emi);
    setCheckingLinked(true);
    setConfirmOpen(true);
    try {
      const res = await api.get(`/emi/${emi._id}/linked`);
      setLinkedInfo(res.data);
    } catch {
      setLinkedInfo(null);
    } finally {
      setCheckingLinked(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/emi/${deleteTarget._id}`);
      toast("EMI deleted", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchEMIs();
    } catch {
      toast.error("Failed to delete EMI");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
      setLinkedInfo(null);
    }
  };

  const filteredEMIs = emis.filter((e) => {
    if (filter === "active") return e.isActive;
    if (filter === "completed") return !e.isActive;
    return true;
  });

  const activeEMIs = emis.filter((e) => e.isActive);
  const totalMonthlyEMI = activeEMIs.reduce((s, e) => s + e.emiAmount, 0);
  const totalOutstanding = activeEMIs.reduce(
    (s, e) => s + (e.tenureMonths - e.paidMonths) * e.emiAmount,
    0,
  );

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm";
  const selectClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";

  // Build the confirmation message with linked-record context
  const getConfirmMessage = () => {
    if (checkingLinked) {
      return "Checking for linked expense entries...";
    }
    if (linkedInfo && linkedInfo.count > 0) {
      return `This EMI has ${linkedInfo.count} linked expense${
        linkedInfo.count > 1 ? "s" : ""
      } totaling ₹${linkedInfo.total.toLocaleString()}. Deleting this EMI will NOT delete those expense records — they'll remain in your Expenses history.`;
    }
    return "This EMI and all its data will be permanently deleted.";
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          🏦 EMI Tracker
        </h1>
        <button
          onClick={() => {
            setEditData(null);
            setFormData({
              name: "",
              totalAmount: "",
              emiAmount: "",
              interestRate: "",
              tenureMonths: "",
              startDate: new Date().toISOString().split("T")[0],
              category: "Other",
              notes: "",
            });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm w-full sm:w-auto"
        >
          {showForm ? "Cancel" : "+ Add EMI"}
        </button>
      </div>

      {activeEMIs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeEMIs.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active EMIs
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              ₹{totalMonthlyEMI.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monthly Outflow
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              ₹{totalOutstanding.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total Outstanding
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData ? "Edit EMI" : "Add EMI"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Home Loan - HDFC"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={selectClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_EMOJIS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 500000"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly EMI (₹)
                </label>
                <input
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, emiAmount: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 15000"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenure (Months)
                </label>
                <input
                  type="number"
                  value={formData.tenureMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, tenureMonths: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 36"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 8.5"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className={inputClass}
                placeholder="Any details about this loan"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : editData ? "Update EMI" : "Add EMI"}
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

      {emis.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["active", "completed", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize whitespace-nowrap flex-shrink-0 ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      ) : filteredEMIs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-8 sm:p-12 text-center">
          <p className="text-4xl mb-3">🏦</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {filter === "completed"
              ? "No completed EMIs yet"
              : filter === "active"
                ? "No active EMIs"
                : "No EMIs added yet"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === "all" || filter === "active"
              ? "Add your first EMI to start tracking"
              : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEMIs.map((emi) => (
            <EMICard
              key={emi._id}
              emi={emi}
              onMarkPaid={handleMarkPaid}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete EMI?"
        message={getConfirmMessage()}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
          setLinkedInfo(null);
        }}
      />
    </div>
  );
}

export default EMIPage;
