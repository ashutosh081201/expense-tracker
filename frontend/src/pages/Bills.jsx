import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORY_EMOJIS = {
  Electricity: "⚡",
  Water: "💧",
  Internet: "🌐",
  Mobile: "📱",
  OTT: "🎬",
  Insurance: "🛡️",
  Rent: "🏠",
  Gas: "🔥",
  "Credit Card": "💳",
  Other: "📄",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function BillCard({ bill, onEdit, onDelete, onMarkPaid }) {
  const statusConfig = {
    paid: {
      bg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-400 dark:border-green-500",
      badge:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      label: "✅ Paid this month",
    },
    overdue: {
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-400 dark:border-red-500",
      badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      label: "🔴 Overdue",
    },
    "due-today": {
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-400 dark:border-orange-400",
      badge:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      label: "🟠 Due Today",
    },
    "due-soon": {
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
      border: "border-yellow-400 dark:border-yellow-300",
      badge:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
      label: `🟡 Due in ${bill.daysUntilDue} days`,
    },
    upcoming: {
      bg: "bg-white dark:bg-gray-800",
      border: "border-transparent dark:border-gray-700",
      badge:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      label: `🟢 Due on ${bill.dueDate}${getDaySuffix(bill.dueDate)}`,
    },
  };

  const config = statusConfig[bill.status] || statusConfig["upcoming"];

  return (
    <div
      className={`rounded-lg shadow border p-4 sm:p-5 transition ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white dark:bg-gray-700 shadow flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
            {CATEGORY_EMOJIS[bill.category]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
              {bill.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bill.category} • Due every {bill.dueDate}
              {getDaySuffix(bill.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(bill)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(bill)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          ₹{bill.amount.toLocaleString()}
        </p>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}
        >
          {config.label}
        </span>
      </div>

      {bill.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3">
          {bill.notes}
        </p>
      )}

      {bill.status !== "paid" ? (
        <button
          onClick={() => onMarkPaid(bill._id)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition text-sm font-medium"
        >
          ✅ Mark as Paid
        </button>
      ) : (
        <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2 rounded text-sm font-medium text-center">
          🔄 Resets next month
        </div>
      )}
    </div>
  );
}

function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const [checkingLinked, setCheckingLinked] = useState(false);
  const [filter, setFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "Other",
    notes: "",
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get("/bills");
      setBills(res.data);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.dueDate < 1 || formData.dueDate > 31) {
      return toast.error("Due date must be between 1 and 31");
    }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/bills/${editData._id}`, formData);
        toast("Bill updated!", {
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
        await api.post("/bills", formData);
        toast.success("Bill reminder added!");
      }
      setShowForm(false);
      setEditData(null);
      setFormData({
        name: "",
        amount: "",
        dueDate: "",
        category: "Other",
        notes: "",
      });
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save bill");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bill) => {
    setEditData(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      category: bill.category,
      notes: bill.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await api.put(`/bills/${id}/paid`);
      toast.success(
        `Bill marked as paid! ₹${res.data.expense.amount.toLocaleString()} added to Expenses.`,
      );
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark paid");
    }
  };

  // Before showing the delete confirmation, check if this Bill
  // has any auto-created Expense entries linked to it, so the
  // user is warned with real numbers before deciding.
  const handleDeleteClick = async (bill) => {
    setDeleteTarget(bill);
    setCheckingLinked(true);
    setConfirmOpen(true);
    try {
      const res = await api.get(`/bills/${bill._id}/linked`);
      setLinkedInfo(res.data);
    } catch {
      setLinkedInfo(null);
    } finally {
      setCheckingLinked(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/bills/${deleteTarget._id}`);
      toast("Bill removed", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchBills();
    } catch {
      toast.error("Failed to delete bill");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
      setLinkedInfo(null);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (filter === "unpaid") return b.status !== "paid";
    if (filter === "paid") return b.status === "paid";
    if (filter === "overdue") return b.status === "overdue";
    if (filter === "due-soon")
      return b.status === "due-today" || b.status === "due-soon";
    return true;
  });

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const paidCount = bills.filter((b) => b.status === "paid").length;
  const overdueCount = bills.filter((b) => b.status === "overdue").length;
  const dueSoonCount = bills.filter(
    (b) => b.status === "due-today" || b.status === "due-soon",
  ).length;

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm";
  const selectClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";

  const getConfirmMessage = () => {
    if (checkingLinked) {
      return "Checking for linked expense entries...";
    }
    if (linkedInfo && linkedInfo.count > 0) {
      return `This bill has ${linkedInfo.count} linked expense${
        linkedInfo.count > 1 ? "s" : ""
      } totaling ₹${linkedInfo.total.toLocaleString()}. Deleting this bill will NOT delete those expense records — they'll remain in your Expenses history.`;
    }
    return "This bill reminder will be permanently deleted.";
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          🔔 Bill Reminders
        </h1>
        <button
          onClick={() => {
            setEditData(null);
            setFormData({
              name: "",
              amount: "",
              dueDate: "",
              category: "Other",
              notes: "",
            });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm w-full sm:w-auto"
        >
          {showForm ? "Cancel" : "+ Add Bill"}
        </button>
      </div>

      {bills.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              ₹{totalMonthly.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monthly Bills
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {paidCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Paid This Month
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Overdue
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {dueSoonCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Due Soon
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData ? "Edit Bill" : "Add Bill Reminder"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bill Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Electricity Bill"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 1500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Day of Month (1–31)
                </label>
                <input
                  type="number"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 5"
                  min="1"
                  max="31"
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
                placeholder="Any details about this bill"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : editData ? "Update Bill" : "Add Bill"}
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

      {bills.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { key: "all", label: "All" },
            { key: "unpaid", label: "⏳ Unpaid" },
            { key: "paid", label: "✅ Paid" },
            { key: "overdue", label: "🔴 Overdue" },
            { key: "due-soon", label: "🟡 Due Soon" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                filter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-8 sm:p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {filter === "paid"
              ? "No bills paid this month yet"
              : filter === "unpaid"
                ? "All bills paid this month! 🎉"
                : filter === "overdue"
                  ? "No overdue bills"
                  : filter === "due-soon"
                    ? "No bills due soon"
                    : "No bill reminders yet"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === "all"
              ? "Add your recurring bills to get reminders"
              : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBills.map((bill) => (
            <BillCard
              key={bill._id}
              bill={bill}
              onEdit={handleEdit}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Bill Reminder?"
        message={getConfirmMessage()}
        confirmLabel="Remove"
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

export default Bills;
