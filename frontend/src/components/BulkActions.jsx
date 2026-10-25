function BulkActions({
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleAll,
  onBulkDelete,
  onClear,
  loading,
}) {
  // Only show when something is selected
  if (totalCount === 0 || selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 rounded-lg border mb-4 transition-all bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      {/* Select All Checkbox */}
      <input
        type="checkbox"
        checked={isAllSelected}
        onChange={onToggleAll}
        className="w-4 h-4 cursor-pointer accent-blue-600 flex-shrink-0"
      />

      {/* Count text */}
      <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-semibold">
        {selectedCount} of {totalCount} selected
      </span>

      {/* Actions */}
      <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
        <button
          onClick={onClear}
          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition whitespace-nowrap"
        >
          Clear
        </button>
        <button
          onClick={onBulkDelete}
          disabled={loading}
          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            loading
              ? "bg-red-300 dark:bg-red-800 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          }`}
        >
          {loading ? "Deleting..." : `🗑️ Delete ${selectedCount}`}
        </button>
      </div>
    </div>
  );
}

export default BulkActions;
