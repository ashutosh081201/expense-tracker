function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
      {/* Count */}
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        Showing {start}–{end} of {totalItems}
      </p>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`border rounded text-xs sm:text-sm font-medium transition px-2.5 sm:px-3 py-1.5 whitespace-nowrap ${
            currentPage === 1
              ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1,
          )
          .reduce((acc, page, idx, arr) => {
            if (idx > 0 && page - arr[idx - 1] > 1) {
              acc.push("...");
            }
            acc.push(page);
            return acc;
          }, [])
          .map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm px-1"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-2.5 sm:px-3 py-1.5 rounded border text-xs sm:text-sm transition ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600 font-semibold"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ),
          )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`border rounded text-xs sm:text-sm font-medium transition px-2.5 sm:px-3 py-1.5 whitespace-nowrap ${
            currentPage === totalPages
              ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Pagination;
