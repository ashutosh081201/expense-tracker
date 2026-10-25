import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import BulkActions from "../components/BulkActions";
import ConfirmModal from "../components/ConfirmModal";
import ExportButtons from "../components/ExportButtons";
import { ListSkeleton } from "../components/SkeletonLoader";
import useSearch from "../hooks/useSearch";
import usePagination from "../hooks/usePagination";
import useBulkSelect from "../hooks/useBulkSelect";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [error, setError] = useState("");
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [confirmSingleOpen, setConfirmSingleOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const categories = [
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

  const categoryEmojis = {
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

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/expenses/${editData._id}`, formData);
        toast("Expense updated!", {
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
        await api.post("/expenses", formData);
        toast.success("Expense added!");
      }
      setShowForm(false);
      setEditData(null);
      setFormData({
        title: "",
        amount: "",
        type: "expense",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setEditData(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      type: "expense",
      category: expense.category,
      date: expense.date.split("T")[0],
      notes: expense.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditData(null);
    setShowForm(false);
    setError("");
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "Food",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  // Robust copy handler — works on mobile too.
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to fallback method below
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleCopy = async (expense) => {
    const text = `Title: ${expense.title}
Amount: Rs. ${expense.amount.toLocaleString()}
Category: ${expense.category}
Date: ${new Date(expense.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}${expense.notes ? `\nNotes: ${expense.notes}` : ""}`;

    const success = await copyText(text);

    if (success) {
      toast("Copied to clipboard!", {
        icon: "📋",
        style: {
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #86efac",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
    } else {
      toast.error("Failed to copy");
    }
  };

  const handleDuplicate = async (expense) => {
    try {
      await api.post("/expenses", {
        title: expense.title,
        amount: expense.amount,
        type: expense.type || "expense",
        category: expense.category,
        date: new Date().toISOString().split("T")[0],
        notes: expense.notes || "",
      });
      toast.success("Expense duplicated with today's date!");
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to duplicate");
      console.error(err);
    }
  };

  const handleSingleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast("Expense deleted", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchExpenses();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setConfirmSingleOpen(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await api.delete("/expenses/bulk", { data: { ids: selected } });
      toast(
        `${selected.length} expense${selected.length > 1 ? "s" : ""} deleted`,
        {
          icon: "🗑️",
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            fontSize: "0.9rem",
          },
        },
      );
      clearSelected();
      fetchExpenses();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBulkLoading(false);
      setConfirmBulkOpen(false);
    }
  };

  const allMonths = [
    ...new Set(
      expenses.map((e) =>
        new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
      ),
    ),
  ];

  let monthFiltered =
    filterMonth === "All"
      ? expenses
      : expenses.filter((e) => {
          const month = new Date(e.date).toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
          return month === filterMonth;
        });

  monthFiltered =
    filterCat === "All"
      ? monthFiltered
      : monthFiltered.filter((e) => e.category === filterCat);

  const sorted = [...monthFiltered].sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortBy === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortBy === "amount-desc") return b.amount - a.amount;
    if (sortBy === "amount-asc") return a.amount - b.amount;
    return 0;
  });

  const {
    searchQuery,
    setSearchQuery,
    filtered: searched,
  } = useSearch(sorted, ["title", "category", "notes"]);

  const { currentPage, setCurrentPage, totalPages, paginated, resetPage } =
    usePagination(searched, 10);

  const {
    selected,
    toggleOne,
    toggleAll,
    clearSelected,
    isSelected,
    isAllSelected,
  } = useBulkSelect(searched, paginated);

  // Group the CURRENT PAGE's entries by month (for rendering rows)
  const groupedByMonth = {};
  paginated.forEach((exp) => {
    const month = new Date(exp.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    groupedByMonth[month].push(exp);
  });

  // Group the FULL filtered dataset (all pages) by month —
  // used ONLY for calculating accurate header totals, so the
  // displayed total always reflects the whole month, not just
  // whatever happens to be on the currently visible page.
  const fullGroupedByMonth = {};
  searched.forEach((exp) => {
    const month = new Date(exp.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!fullGroupedByMonth[month]) fullGroupedByMonth[month] = [];
    fullGroupedByMonth[month].push(exp);
  });

  const getMonthlyTotal = (monthKey) => {
    const exps = fullGroupedByMonth[monthKey] || [];
    const income = exps
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const expense = exps
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);
    return { income, expense };
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm";
  const selectClass =
    "border border-gray-300 dark:border-gray-600 rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto";

  if (loading) return <ListSkeleton />;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Expenses
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButtons
            data={searched}
            type="expenses"
            filename={`expenses-${new Date().toLocaleDateString("en-IN")}`}
          />
          <button
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setEditData(null);
                setShowForm(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded transition text-sm whitespace-nowrap"
          >
            {showForm ? "Cancel" : "+ Add Expense"}
          </button>
        </div>
      </div>

      {/* Form (merged inline) */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6 border border-transparent dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData ? "Edit Expense" : "Add Expense"}
          </h2>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title + Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Zomato"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 500"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${
                      formData.category === cat
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <span className="text-lg">{categoryEmojis[cat]}</span>
                    <span className="text-center leading-tight">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={inputClass}
                  style={{ colorScheme: "auto" }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Any extra details"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : editData ? "Update" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <SearchBar
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            resetPage();
          }}
          placeholder="Search expenses..."
        />
      </div>

      {/* Filters + Sort */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            Month:
          </label>
          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              resetPage();
            }}
            className={selectClass}
          >
            <option value="All">All Time</option>
            {allMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            Category:
          </label>
          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              resetPage();
            }}
            className={selectClass}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 col-span-2 sm:col-span-1">
          <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            Sort:
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              resetPage();
            }}
            className={selectClass}
          >
            <option value="date-desc">Date — Newest First</option>
            <option value="date-asc">Date — Oldest First</option>
            <option value="amount-desc">Amount — High to Low</option>
            <option value="amount-asc">Amount — Low to High</option>
          </select>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 col-span-2 sm:col-span-1 sm:ml-auto text-right sm:text-left">
          {searched.length} transactions
        </span>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selected.length}
        totalCount={paginated.length}
        isAllSelected={isAllSelected}
        onToggleAll={toggleAll}
        onBulkDelete={() => setConfirmBulkOpen(true)}
        onClear={clearSelected}
        loading={bulkLoading}
      />

      {/* Empty State */}
      {searched.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
          <EmptyState
            icon="💸"
            title={
              searchQuery
                ? `No results for "${searchQuery}"`
                : filterMonth !== "All"
                  ? `No expenses in ${filterMonth}`
                  : "No expenses yet"
            }
            message={
              searchQuery
                ? "Try a different search term"
                : "Add your first expense to start tracking"
            }
            action={!searchQuery ? () => setShowForm(true) : null}
            actionLabel="+ Add Expense"
          />
        </div>
      )}

      {/* Grouped by Month */}
      {Object.entries(groupedByMonth).map(([month, exps]) => {
        const { income, expense } = getMonthlyTotal(month);
        const balance = income - expense;
        return (
          <div key={month} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
                📅 {month}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +₹{income.toLocaleString()}
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  − ₹{expense.toLocaleString()}
                </span>
                <span
                  className={`font-bold ${
                    balance >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {`= ${balance >= 0 ? "" : "− "}₹${Math.abs(balance).toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
              {exps.map((expense, idx) => (
                <div
                  key={expense._id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-2 sm:gap-3 ${
                    idx !== exps.length - 1
                      ? "border-b border-gray-100 dark:border-gray-700"
                      : ""
                  } ${
                    isSelected(expense._id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  } transition`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected(expense._id)}
                      onChange={() => toggleOne(expense._id)}
                      style={{ cursor: "pointer", flexShrink: 0 }}
                    />
                    <div
                      className={`w-2 h-10 rounded-full flex-shrink-0 ${
                        expense.type === "income"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">
                        {expense.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {expense.category} •{" "}
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                    <p
                      className={`font-bold text-base sm:text-lg flex-shrink-0 sm:hidden ${
                        expense.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {expense.type === "income" ? "+" : "-"}₹
                      {expense.amount.toLocaleString()}
                    </p>
                  </div>

                  {/* Desktop only: amount pinned top-right, actions row below it */}
                  <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1.5 sm:flex-shrink-0">
                    <p
                      className={`font-bold text-lg ${
                        expense.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {expense.type === "income" ? "+" : "-"}₹
                      {expense.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(expense)}
                        title="Copy to clipboard"
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition text-sm"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDuplicate(expense)}
                        title="Duplicate with today's date"
                        className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition text-sm"
                      >
                        🔁
                      </button>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(expense._id);
                          setConfirmSingleOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Mobile only: action row */}
                  <div className="flex sm:hidden items-center justify-end gap-3 pl-8">
                    <button
                      onClick={() => handleCopy(expense)}
                      title="Copy to clipboard"
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition text-sm"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDuplicate(expense)}
                      title="Duplicate with today's date"
                      className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition text-sm"
                    >
                      🔁
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(expense._id);
                        setConfirmSingleOpen(true);
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={searched.length}
        itemsPerPage={10}
      />

      <ConfirmModal
        isOpen={confirmSingleOpen}
        title="Delete Expense?"
        message="This expense will be permanently deleted."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={handleSingleDelete}
        onCancel={() => {
          setConfirmSingleOpen(false);
          setDeleteId(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmBulkOpen}
        title={`Delete ${selected.length} expense${selected.length > 1 ? "s" : ""}?`}
        message="All selected expenses will be permanently deleted."
        confirmLabel="Delete All"
        confirmColor="red"
        onConfirm={handleBulkDelete}
        onCancel={() => {
          setConfirmBulkOpen(false);
          clearSelected();
        }}
      />
    </div>
  );
}

export default Expenses;
