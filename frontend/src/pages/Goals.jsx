import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORY_EMOJIS = {
  "Emergency Fund": "🆘",
  Travel: "✈️",
  Education: "📚",
  Home: "🏠",
  Vehicle: "🚗",
  Wedding: "💍",
  Retirement: "👴",
  Business: "🏢",
  Other: "🎯",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

function GoalCard({ goal, onAddMoney, onDelete, onEdit }) {
  const percent = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100,
  );
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil(
    (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysLeft < 0 && !goal.isCompleted;
  const isCompleted = goal.isCompleted;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border p-4 sm:p-5 transition ${
        isCompleted
          ? "border-green-300 dark:border-green-700"
          : isOverdue
            ? "border-red-200 dark:border-red-800"
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
            {CATEGORY_EMOJIS[goal.category]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
                {goal.title}
              </p>
              {isCompleted && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  ✅ Completed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {goal.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex justify-between items-baseline mb-2 flex-wrap gap-1">
        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          ₹{goal.currentAmount.toLocaleString()}
        </span>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          of ₹{goal.targetAmount.toLocaleString()}
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

      <div className="flex flex-wrap justify-between gap-1.5 items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {percent}% saved
        </span>
        {!isCompleted && <span>₹{remaining.toLocaleString()} to go</span>}
        <span
          className={
            isOverdue
              ? "text-red-500 dark:text-red-400 font-medium"
              : isCompleted
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
          }
        >
          {isCompleted
            ? "🎉 Goal reached!"
            : isOverdue
              ? `${Math.abs(daysLeft)} days overdue`
              : `${daysLeft} days left`}
        </span>
      </div>

      {goal.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3">
          {goal.notes}
        </p>
      )}

      {!isCompleted && (
        <button
          onClick={() => onAddMoney(goal)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition text-sm font-medium"
        >
          + Add Money
        </button>
      )}
    </div>
  );
}

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const [checkingLinked, setCheckingLinked] = useState(false);
  const [addMoneyGoal, setAddMoneyGoal] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
    category: "Other",
    notes: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/goals/${editData._id}`, formData);
        toast("Goal updated!", {
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
        await api.post("/goals", formData);
        toast.success("Goal created!");
      }
      setShowForm(false);
      setEditData(null);
      setFormData({
        title: "",
        targetAmount: "",
        deadline: "",
        category: "Other",
        notes: "",
      });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal) => {
    setEditData(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline.split("T")[0],
      category: goal.category,
      notes: goal.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Before showing the delete confirmation, check if this Goal
  // has any auto-created Saving entries linked to it, so the
  // user is warned with real numbers before deciding.
  const handleDeleteClick = async (goal) => {
    setDeleteTarget(goal);
    setCheckingLinked(true);
    setConfirmOpen(true);
    try {
      const res = await api.get(`/goals/${goal._id}/linked`);
      setLinkedInfo(res.data);
    } catch {
      setLinkedInfo(null);
    } finally {
      setCheckingLinked(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/goals/${deleteTarget._id}`);
      toast("Goal deleted", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchGoals();
    } catch {
      toast.error("Failed to delete goal");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
      setLinkedInfo(null);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addAmount || parseFloat(addAmount) <= 0) {
      return toast.error("Enter a valid amount");
    }
    try {
      await api.put(`/goals/${addMoneyGoal._id}/addmoney`, {
        amount: parseFloat(addAmount),
      });
      toast.success(
        `₹${parseFloat(addAmount).toLocaleString()} added! Also logged in Savings.`,
      );
      setAddMoneyGoal(null);
      setAddAmount("");
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add money");
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return !g.isCompleted;
    if (filter === "completed") return g.isCompleted;
    return true;
  });

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedCount = goals.filter((g) => g.isCompleted).length;

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm";

  const getConfirmMessage = () => {
    if (checkingLinked) {
      return "Checking for linked saving entries...";
    }
    if (linkedInfo && linkedInfo.count > 0) {
      return `This goal has ${linkedInfo.count} linked saving${
        linkedInfo.count > 1 ? "s" : ""
      } totaling ₹${linkedInfo.total.toLocaleString()}. Deleting this goal will NOT delete those saving records — they'll remain in your Savings history.`;
    }
    return "This goal and all its progress will be permanently deleted.";
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          🎯 Financial Goals
        </h1>
        <button
          onClick={() => {
            setEditData(null);
            setFormData({
              title: "",
              targetAmount: "",
              deadline: "",
              category: "Other",
              notes: "",
            });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm w-full sm:w-auto"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {goals.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total Goals
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-transparent dark:border-gray-700 text-center">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ₹{totalSaved.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of ₹{totalTarget.toLocaleString()} saved
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData ? "Edit Goal" : "New Goal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Emergency Fund"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 50000"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className={inputClass}
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
                  className={inputClass}
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
                placeholder="Any details about this goal"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving
                  ? "Saving..."
                  : editData
                    ? "Update Goal"
                    : "Create Goal"}
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

      {addMoneyGoal && (
        <>
          <div
            onClick={() => {
              setAddMoneyGoal(null);
              setAddAmount("");
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 999,
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: "12px",
              padding: "1.5rem",
              width: "calc(100% - 2rem)",
              maxWidth: "380px",
              zIndex: 1000,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              Add Money
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Adding to: <strong>{addMoneyGoal.title}</strong>
            </p>
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 5000"
                  min="1"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition font-medium"
                >
                  Add ₹
                  {addAmount ? parseFloat(addAmount).toLocaleString() : "0"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddMoneyGoal(null);
                    setAddAmount("");
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {goals.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["all", "active", "completed"].map((f) => (
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
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-8 sm:p-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {filter === "completed"
              ? "No completed goals yet"
              : filter === "active"
                ? "No active goals"
                : "No goals yet"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === "all" &&
              "Create your first financial goal to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onAddMoney={setAddMoneyGoal}
              onDelete={handleDeleteClick}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Goal?"
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

export default Goals;
