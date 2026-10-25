function EmptyState({ title, message, icon, action, actionLabel }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1.25rem",
        textAlign: "center",
      }}
      className="sm:!py-16 sm:!px-8"
    >
      {/* SVG Illustration */}
      <svg
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "150px", marginBottom: "1.25rem" }}
        className="sm:!w-[180px] sm:!mb-6"
      >
        <ellipse
          cx="100"
          cy="140"
          rx="80"
          ry="10"
          fill="currentColor"
          className="text-gray-100 dark:text-gray-700"
        />

        <rect
          x="40"
          y="60"
          width="120"
          height="80"
          rx="8"
          fill="currentColor"
          className="text-blue-100 dark:text-blue-900/40"
          stroke="currentColor"
          strokeWidth="2"
        />

        <rect
          x="35"
          y="52"
          width="130"
          height="20"
          rx="6"
          fill="currentColor"
          className="text-blue-200 dark:text-blue-800/50"
          stroke="currentColor"
          strokeWidth="2"
        />

        <line
          x1="60"
          y1="88"
          x2="140"
          y2="88"
          stroke="currentColor"
          className="text-blue-300 dark:text-blue-700"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="60"
          y1="102"
          x2="120"
          y2="102"
          stroke="currentColor"
          className="text-blue-300 dark:text-blue-700"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="60"
          y1="116"
          x2="130"
          y2="116"
          stroke="currentColor"
          className="text-blue-300 dark:text-blue-700"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <text
          x="100"
          y="48"
          textAnchor="middle"
          fontSize="28"
          fontFamily="Arial"
        >
          {icon || "📭"}
        </text>

        <circle
          cx="30"
          cy="80"
          r="4"
          fill="currentColor"
          className="text-blue-200 dark:text-blue-700"
        />
        <circle
          cx="170"
          cy="70"
          r="3"
          fill="currentColor"
          className="text-blue-200 dark:text-blue-700"
        />
        <circle
          cx="25"
          cy="110"
          r="3"
          fill="currentColor"
          className="text-blue-100 dark:text-blue-800"
        />
        <circle
          cx="175"
          cy="110"
          r="4"
          fill="currentColor"
          className="text-blue-100 dark:text-blue-800"
        />
      </svg>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-1">
        {title || "Nothing here yet"}
      </h3>

      {/* Message */}
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs leading-relaxed">
        {message || "Add your first entry to get started"}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {actionLabel || "+ Add Now"}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
