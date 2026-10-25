import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import BulkActions from "../components/BulkActions";
import ExportButtons from "../components/ExportButtons";
import { ListSkeleton } from "../components/SkeletonLoader";
import useSearch from "../hooks/useSearch";
import usePagination from "../hooks/usePagination";
import useBulkSelect from "../hooks/useBulkSelect";

function Savings() {
  const [savings, setSavings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [error, setError] = useState("");
  const [confirmSingleOpen, setConfirmSingleOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Saving Account",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const categories = [
    "Saving Account",
    "Current Account",
    "Fixed Deposit",
    "Stocks",
    "Mutual Funds",
    "Gold",
    "Real Estate",
    "Crypto",
    "PPF",
    "Other",
  ];

  const categoryEmojis = {
    "Saving Account": "🏦",
    "Current Account": "💳",
    "Fixed Deposit": "🔒",
    Stocks: "📈",
    "Mutual Funds": "📊",
    Gold: "🥇",
    "Real Estate": "🏠",
    Crypto: "₿",
    PPF: "📋",
    Other: "💰",
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const res = await api.get("/saving");
      setSavings(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load savings");
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
    try {
      if (editData) {
        await api.put(`/saving/${editData._id}`, formData);
        toast("Saving updated!", {
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
        await api.post("/saving", formData);
        toast.success("Saving added!");
      }
      fetchSavings();
      setShowForm(false);
      setEditData(null);
      setFormData({
        title: "",
        amount: "",
        category: "Saving Account",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      toast.error("Failed to save");
    }
  };

  const handleEdit = (saving) => {
    setEditData(saving);
    setFormData({
      title: saving.title,
      amount: saving.amount,
      category: saving.category,
      date: saving.date.split("T")[0],
      notes: saving.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleCopy = async (saving) => {
    const text = `Title: ${saving.title}
Amount: Rs. ${saving.amount.toLocaleString()}
Category: ${saving.category}
Date: ${new Date(saving.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}${saving.notes ? `\nNotes: ${saving.notes}` : ""}`;

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

  const handleDuplicate = async (saving) => {
    try {
      await api.post("/saving", {
        title: saving.title,
        amount: saving.amount,
        category: saving.category,
        date: new Date().toISOString().split("T")[0],
        notes: saving.notes || "",
      });
      toast.success("Saving duplicated with today's date!");
      fetchSavings();
    } catch (err) {
      toast.error("Failed to duplicate");
      console.error(err);
    }
  };

  const handleSingleDelete = async () => {
    try {
      await api.delete(`/saving/${deleteId}`);
      toast("Saving deleted", {
        icon: "🗑️",
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
      });
      fetchSavings();
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
      await api.delete("/saving/bulk", { data: { ids: selected } });
      toast(
        `${selected.length} saving${selected.length > 1 ? "s" : ""} deleted`,
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
      fetchSavings();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBulkLoading(false);
      setConfirmBulkOpen(false);
    }
  };

  const allMonths = [
    ...new Set(
      savings.map((e) =>
        new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
      ),
    ),
  ];

  let monthFiltered =
    filterMonth === "All"
      ? savings
      : savings.filter((e) => {
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
  paginated.forEach((sav) => {
    const month = new Date(sav.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    groupedByMonth[month].push(sav);
  });

  // Group the FULL filtered dataset (all pages) by month —
  // used ONLY for calculating accurate header totals, so the
  // displayed total always reflects the whole month, not just
  // whatever happens to be on the currently visible page.
  const fullGroupedByMonth = {};
  searched.forEach((sav) => {
    const month = new Date(sav.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!fullGroupedByMonth[month]) fullGroupedByMonth[month] = [];
    fullGroupedByMonth[month].push(sav);
  });

  const getMonthlyTotal = (monthKey) => {
    const items = fullGroupedByMonth[monthKey] || [];
    return items.reduce((s, e) => s + e.amount, 0);
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
  const selectClass =
    "border border-gray-300 dark:border-gray-600 rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto";

  if (loading) return <ListSkeleton />;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          💰 Savings
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButtons
            data={searched}
            type="savings"
            filename={`savings-${new Date().toLocaleDateString("en-IN")}`}
          />
          <button
            onClick={() => {
              setEditData(null);
              setFormData({
                title: "",
                amount: "",
                category: "Saving Account",
                date: new Date().toISOString().split("T")[0],
                notes: "",
              });
              setShowForm(!showForm);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded transition text-sm whitespace-nowrap"
          >
            {showForm ? "Cancel" : "+ Add Saving"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6 border border-transparent dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editData ? "Edit Saving" : "Add Saving"}
          </h2>
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. HDFC FD"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="10000"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
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
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <span className="text-lg">{categoryEmojis[cat]}</span>
                    <span className="text-center leading-tight">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any details..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition font-medium"
              >
                {editData ? "Update" : "Add Saving"}
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

      {/* Search Bar */}
      <div className="mb-3">
        <SearchBar
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            resetPage();
          }}
          placeholder="Search savings..."
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
          {searched.length} entries
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
            icon="💰"
            title={
              searchQuery
                ? `No results for "${searchQuery}"`
                : "No savings entries yet"
            }
            message={
              searchQuery
                ? "Try a different search term"
                : "Add your first saving to start tracking"
            }
            action={!searchQuery ? () => setShowForm(true) : null}
            actionLabel="+ Add Saving"
          />
        </div>
      )}

      {/* Grouped by Month */}
      {Object.entries(groupedByMonth).map(([month, items]) => {
        const total = getMonthlyTotal(month);
        return (
          <div key={month} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
                📅 {month}
              </h2>
              <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">
                ₹{total.toLocaleString()} saved
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
              {items.map((sav, idx) => (
                <div
                  key={sav._id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-2 sm:gap-3 ${
                    idx !== items.length - 1
                      ? "border-b border-gray-100 dark:border-gray-700"
                      : ""
                  } ${
                    isSelected(sav._id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  } transition`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected(sav._id)}
                      onChange={() => toggleOne(sav._id)}
                      style={{ cursor: "pointer", flexShrink: 0 }}
                    />
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-xl flex-shrink-0">
                      {categoryEmojis[sav.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">
                        {sav.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {sav.category} •{" "}
                        {new Date(sav.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {sav.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate">
                          {sav.notes}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-purple-600 dark:text-purple-400 text-base sm:hidden flex-shrink-0">
                      ₹{sav.amount.toLocaleString()}
                    </p>
                  </div>

                  {/* Desktop only: amount pinned top-right, actions row below it */}
                  <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1.5 sm:flex-shrink-0">
                    <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                      ₹{sav.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(sav)}
                        title="Copy to clipboard"
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition text-sm"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDuplicate(sav)}
                        title="Duplicate with today's date"
                        className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition text-sm"
                      >
                        🔁
                      </button>
                      <button
                        onClick={() => handleEdit(sav)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(sav._id);
                          setConfirmSingleOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Mobile only: action row */}
                  <div className="flex sm:hidden items-center justify-end gap-3 pl-16">
                    <button
                      onClick={() => handleCopy(sav)}
                      title="Copy to clipboard"
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition text-sm"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDuplicate(sav)}
                      title="Duplicate with today's date"
                      className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition text-sm"
                    >
                      🔁
                    </button>
                    <button
                      onClick={() => handleEdit(sav)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(sav._id);
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
        title="Delete Saving?"
        message="This saving entry will be permanently deleted."
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
        title={`Delete ${selected.length} saving${selected.length > 1 ? "s" : ""}?`}
        message="All selected savings will be permanently deleted."
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

export default Savings;
