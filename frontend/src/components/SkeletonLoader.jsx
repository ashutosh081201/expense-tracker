function SkeletonBox({ width, height, borderRadius }) {
  return (
    <div
      style={{
        width: width || "100%",
        height: height || "16px",
        borderRadius: borderRadius || "4px",
        animation: "shimmer 1.5s infinite linear",
        background: "var(--skeleton-bg)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Title */}
      <SkeletonBox width="160px" height="28px" borderRadius="8px" />
      <div style={{ marginBottom: "1.5rem" }} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700"
          >
            <SkeletonBox width="80px" height="12px" />
            <div style={{ marginBottom: "8px" }} />
            <SkeletonBox width="100%" height="24px" />
          </div>
        ))}
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} width="100px" height="32px" borderRadius="8px" />
        ))}
      </div>

      {/* Month cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700"
          >
            <SkeletonBox width="100px" height="12px" />
            <div style={{ marginBottom: "8px" }} />
            <SkeletonBox width="100%" height="28px" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700"
          >
            <SkeletonBox width="140px" height="18px" />
            <div style={{ marginBottom: "1.25rem" }} />
            <SkeletonBox width="100%" height="180px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <SkeletonBox width="130px" height="28px" borderRadius="8px" />
        <SkeletonBox width="110px" height="34px" borderRadius="8px" />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} width="100px" height="30px" borderRadius="6px" />
        ))}
      </div>

      {/* Month header */}
      <div className="flex justify-between mb-3">
        <SkeletonBox width="110px" height="18px" />
        <SkeletonBox width="70px" height="18px" />
      </div>

      {/* List items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 space-y-4 border border-transparent dark:border-gray-700">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonBox width="36px" height="36px" borderRadius="8px" />
              <div>
                <SkeletonBox width="120px" height="14px" />
                <div style={{ marginBottom: "6px" }} />
                <SkeletonBox width="90px" height="11px" />
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <SkeletonBox width="70px" height="18px" />
              <SkeletonBox width="26px" height="14px" />
              <SkeletonBox width="36px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonBox;
