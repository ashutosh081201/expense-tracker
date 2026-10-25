function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 p-6 sm:p-8"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "12px",
          width: "calc(100% - 2rem)",
          maxWidth: "400px",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Icon */}
        <div
          className={`${
            confirmColor === "red"
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-blue-100 dark:bg-blue-900/30"
          }`}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          {confirmColor === "red" ? "🗑️" : "⚠️"}
        </div>

        {/* Title */}
        <h3
          className="text-gray-900 dark:text-white"
          style={{
            fontSize: "1.1rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
          }}
        >
          {title || "Are you sure?"}
        </h3>

        {/* Message */}
        <p
          className="text-gray-500 dark:text-gray-400"
          style={{
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
            lineHeight: 1.6,
          }}
        >
          {message || "This action cannot be undone."}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: confirmColor === "red" ? "#ef4444" : "#2563eb",
              color: "white",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor =
                confirmColor === "red" ? "#dc2626" : "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor =
                confirmColor === "red" ? "#ef4444" : "#2563eb";
            }}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
