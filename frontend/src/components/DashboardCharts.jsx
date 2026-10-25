import { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Filler,
} from "chart.js";
import { Pie, Bar, Doughnut, Line } from "react-chartjs-2";
import { useTheme } from "../context/useTheme";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Filler,
);

// ─── 1. BUDGET VS ACTUAL ──────────────────────────────────
export function BudgetVsActualChart({ budgets }) {
  const { isDark } = useTheme();

  if (!budgets || budgets.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const data = {
    labels: budgets.map((b) => b.category),
    datasets: [
      {
        label: "Budget Limit",
        data: budgets.map((b) => b.limit),
        backgroundColor: isDark ? "#374151" : "#e5e7eb",
        borderRadius: 4,
      },
      {
        label: "Actual Spent",
        data: budgets.map((b) => b.spent),
        backgroundColor: budgets.map((b) =>
          b.status === "exceeded"
            ? "#ef4444"
            : b.status === "warning"
              ? "#eab308"
              : "#22c55e",
        ),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Budget vs Actual Spending",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          💳 Budget vs Actual
        </h2>
        <div className="flex gap-2 sm:ml-auto text-xs w-full sm:w-auto justify-start sm:justify-end">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Safe</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Warning</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Exceeded</span>
          </span>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          height: `${Math.max(220, budgets.length * 55)}px`,
        }}
      >
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── 2. MONTHLY CASH FLOW ─────────────────────────────────
export function MonthlyCashFlowChart({ expenses, incomes, savings }) {
  const { isDark } = useTheme();

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
    );
  }

  const getMonthTotal = (items, month) =>
    items
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .reduce((s, e) => s + e.amount, 0);

  const incomeData = months.map((m) => getMonthTotal(incomes, m));
  const expenseData = months.map((m) =>
    expenses
      .filter((e) => e.type === "expense")
      .filter((e) => {
        const em = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return em === m;
      })
      .reduce((s, e) => s + e.amount, 0),
  );
  const savingData = months.map((m) => getMonthTotal(savings, m));

  const data = {
    labels: months,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        backgroundColor: "#22c55e",
        borderRadius: 4,
      },
      {
        label: "Expenses",
        data: expenseData,
        backgroundColor: "#ef4444",
        borderRadius: 4,
      },
      {
        label: "Savings",
        data: savingData,
        backgroundColor: "#a855f7",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Monthly Cash Flow — Last 6 Months",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div style={{ position: "relative", height: "320px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── 3. GOALS PROGRESS ────────────────────────────────────
export function GoalsProgressChart({ goals }) {
  const { isDark } = useTheme();

  if (!goals || goals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        🎯 Financial Goals Progress
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.slice(0, 6).map((goal) => {
          const pct = Math.min(
            Math.round((goal.currentAmount / goal.targetAmount) * 100),
            100,
          );
          const remaining = goal.targetAmount - goal.currentAmount;
          const daysLeft = Math.ceil(
            (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24),
          );
          const isOverdue = daysLeft < 0 && !goal.isCompleted;
          const isCompleted = goal.isCompleted;

          const barColor = isCompleted
            ? "#22c55e"
            : isOverdue
              ? "#ef4444"
              : pct >= 75
                ? "#22c55e"
                : pct >= 40
                  ? "#eab308"
                  : "#3b82f6";

          return (
            <div
              key={goal._id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                    {goal.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {goal.category}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                    isCompleted
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : isOverdue
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {isCompleted
                    ? "✅ Done"
                    : isOverdue
                      ? "⚠️ Overdue"
                      : `${daysLeft}d left`}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>₹{goal.currentAmount.toLocaleString()}</span>
                <span className="font-bold" style={{ color: barColor }}>
                  {pct}%
                </span>
                <span>₹{goal.targetAmount.toLocaleString()}</span>
              </div>

              <div
                style={{
                  height: "8px",
                  background: isDark ? "#374151" : "#f1f5f9",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: barColor,
                    borderRadius: "9999px",
                    transition: "width 0.7s ease",
                  }}
                />
              </div>

              {!isCompleted && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ₹{remaining.toLocaleString()} remaining
                </p>
              )}
            </div>
          );
        })}
      </div>

      {goals.length > 6 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          Showing 6 of {goals.length} goals
        </p>
      )}
    </div>
  );
}

// ─── 4. EMI BURDEN (paid vs remaining months) ─────────────
export function EMIBurdenChart({ emis }) {
  const { isDark } = useTheme();
  const activeEMIs = emis?.filter((e) => e.isActive) || [];
  if (activeEMIs.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const data = {
    labels: activeEMIs.map((e) => e.name),
    datasets: [
      {
        label: "Paid Months",
        data: activeEMIs.map((e) => e.paidMonths),
        backgroundColor: "#22c55e",
        borderRadius: 4,
      },
      {
        label: "Remaining Months",
        data: activeEMIs.map((e) => e.tenureMonths - e.paidMonths),
        backgroundColor: "#ef4444",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 0, right: 8, bottom: 4, left: 4 } },
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 }, padding: 8 },
      },
      title: {
        display: true,
        text: "EMI Progress — Paid vs Remaining",
        color: titleColor,
        font: { size: 13 },
        padding: { top: 0, bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${ctx.raw} months` +
            ` (₹${(ctx.raw * (activeEMIs[ctx.dataIndex]?.emiAmount || 0)).toLocaleString()})`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        stacked: true,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
    },
  };

  const totalMonthly = activeEMIs.reduce((s, e) => s + e.emiAmount, 0);
  const totalOutstanding = activeEMIs.reduce(
    (s, e) => s + (e.tenureMonths - e.paidMonths) * e.emiAmount,
    0,
  );

  // Content grows taller as more EMIs are added, but the
  // OUTER CARD stays fixed at 400px — content scrolls
  // vertically instead of growing the card itself
  const contentHeight = Math.max(220, activeEMIs.length * 60);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "400px" }}
    >
      <div className="flex items-center justify-end mb-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Monthly Outflow
          </p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">
            ₹{totalMonthly.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Outstanding
          </p>
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
            ₹{totalOutstanding.toLocaleString()}
          </p>
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, overflowY: "auto" }}>
        <div style={{ position: "relative", height: `${contentHeight}px` }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 5. BILLS OVERVIEW ────────────────────────────────────
export function BillsOverviewChart({ bills }) {
  const { isDark } = useTheme();

  if (!bills || bills.length === 0) return null;

  const paid = bills.filter((b) => b.status === "paid").length;
  const overdue = bills.filter((b) => b.status === "overdue").length;
  const dueSoon = bills.filter(
    (b) => b.status === "due-today" || b.status === "due-soon",
  ).length;
  const upcoming = bills.filter((b) => b.status === "upcoming").length;

  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const legendColor = isDark ? "#d1d5db" : "#374151";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = bills
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + b.amount, 0);

  const donutLabels = [];
  const donutData = [];
  const donutColors = [];
  const statusMap = [
    { label: "Paid", value: paid, color: "#22c55e" },
    { label: "Overdue", value: overdue, color: "#ef4444" },
    { label: "Due Soon", value: dueSoon, color: "#eab308" },
    { label: "Upcoming", value: upcoming, color: "#94a3b8" },
  ];
  statusMap.forEach((s) => {
    if (s.value > 0) {
      donutLabels.push(s.label);
      donutData.push(s.value);
      donutColors.push(s.color);
    }
  });

  const donutChartData = {
    labels: donutLabels,
    datasets: [
      {
        data: donutData,
        backgroundColor: donutColors,
        borderWidth: donutData.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: legendColor,
          padding: 12,
          font: { size: 11 },
        },
      },
      title: {
        display: true,
        text: "Bills Status This Month",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: gridColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.raw} bill${ctx.raw !== 1 ? "s" : ""}`,
        },
      },
    },
  };

  const categoryMap = {};
  bills.forEach((b) => {
    if (!categoryMap[b.category]) categoryMap[b.category] = 0;
    categoryMap[b.category] += b.amount;
  });
  const categoryLabels = Object.keys(categoryMap);
  const categoryValues = Object.values(categoryMap);

  const barData = {
    labels: categoryLabels,
    datasets: [
      {
        label: "Monthly Amount (₹)",
        data: categoryValues,
        backgroundColor: [
          "#22c55e",
          "#3b82f6",
          "#a855f7",
          "#ef4444",
          "#eab308",
          "#f97316",
          "#06b6d4",
          "#ec4899",
          "#84cc16",
          "#94a3b8",
        ].slice(0, categoryLabels.length),
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Bills by Category",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}/month`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
        <div className="flex justify-between text-xs mb-4">
          <div>
            <p className="text-gray-400 dark:text-gray-500">Total Monthly</p>
            <p className="font-bold text-gray-800 dark:text-white text-sm">
              ₹{totalMonthly.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 dark:text-gray-500">Paid This Month</p>
            <p className="font-bold text-green-600 dark:text-green-400 text-sm">
              ₹{paidAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="max-w-xs mx-auto">
          <Doughnut data={donutChartData} options={donutOptions} />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            {
              label: "Paid",
              count: paid,
              color: "text-green-600 dark:text-green-400",
            },
            {
              label: "Overdue",
              count: overdue,
              color: "text-red-600 dark:text-red-400",
            },
            {
              label: "Due Soon",
              count: dueSoon,
              color: "text-yellow-600 dark:text-yellow-400",
            },
            {
              label: "Upcoming",
              count: upcoming,
              color: "text-gray-500 dark:text-gray-400",
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg sm:text-xl font-bold ${s.color}`}>
                {s.count}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {categoryLabels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
          <Bar data={barData} options={barOptions} />
        </div>
      )}
    </div>
  );
}

// ─── 6. NET WORTH DASHBOARD (Hero + Detail Lists only) ────
export function NetWorthDashboardChart({ netWorthData }) {
  const { isDark } = useTheme();
  if (!netWorthData) return null;

  const {
    netWorth = 0,
    totalAssets = 0,
    totalLiabilities = 0,
    breakdown = {},
  } = netWorthData;

  const allAssets = [
    ...(breakdown.autoAssets || []),
    ...(breakdown.manualAssets || []),
  ];
  const allLiabilities = [
    ...(breakdown.autoLiabilities || []),
    ...(breakdown.manualLiabilities || []),
  ];

  const netWorthPositive = netWorth >= 0;

  return (
    <div className="space-y-4">
      {/* Net Worth Hero */}
      <div
        style={{
          background: netWorthPositive
            ? "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
            : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          borderRadius: "12px",
          padding: "1.25rem 1.25rem",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        className="sm:!p-8"
      >
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.5rem",
          }}
          className="!text-[0.7rem] sm:!text-xs"
        >
          Total Net Worth
        </p>
        <p
          style={{
            color: "white",
            fontWeight: "800",
            lineHeight: 1,
          }}
          className="!text-3xl sm:!text-4xl"
        >
          {netWorthPositive ? "" : "-"}₹{Math.abs(netWorth).toLocaleString()}
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            marginTop: "0.5rem",
          }}
          className="!text-xs sm:!text-sm"
        >
          {netWorthPositive
            ? "Your assets exceed your liabilities ✅"
            : "Your liabilities exceed your assets ⚠️"}
        </p>
      </div>

      {/* Assets + Liabilities Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 border border-transparent dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            📦 Assets ({allAssets.length})
          </h3>
          {allAssets.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No assets added yet
            </p>
          ) : (
            <div className="space-y-2">
              {allAssets.map((asset, idx) => {
                const pct =
                  totalAssets > 0
                    ? Math.round((asset.value / totalAssets) * 100)
                    : 0;
                return (
                  <div key={asset._id || idx}>
                    <div className="flex flex-wrap justify-between gap-1 text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {asset.name}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-bold whitespace-nowrap">
                        ₹{asset.value.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        background: isDark ? "#374151" : "#f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#22c55e",
                          borderRadius: "9999px",
                          transition: "width 0.7s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 border border-transparent dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            📉 Liabilities ({allLiabilities.length})
          </h3>
          {allLiabilities.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No liabilities 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {allLiabilities.map((liability, idx) => {
                const pct =
                  totalLiabilities > 0
                    ? Math.round((liability.value / totalLiabilities) * 100)
                    : 0;
                return (
                  <div key={liability._id || idx}>
                    <div className="flex flex-wrap justify-between gap-1 text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {liability.name}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold whitespace-nowrap">
                        ₹{liability.value.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        background: isDark ? "#374151" : "#f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#ef4444",
                          borderRadius: "9999px",
                          transition: "width 0.7s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 7. SAVINGS RATE TREND ────────────────────────────────
export function SavingsRateChart({ incomes, savings }) {
  const { isDark } = useTheme();

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
    );
  }

  const getMonthTotal = (items, month) =>
    items
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .reduce((s, e) => s + e.amount, 0);

  const savingsRates = months.map((m) => {
    const income = getMonthTotal(incomes, m);
    const saving = getMonthTotal(savings, m);
    return income > 0 ? Math.round((saving / income) * 100) : 0;
  });

  const avgRate =
    savingsRates.length > 0
      ? Math.round(
          savingsRates.reduce((s, r) => s + r, 0) / savingsRates.length,
        )
      : 0;

  const data = {
    labels: months,
    datasets: [
      {
        label: "Savings Rate (%)",
        data: savingsRates,
        borderColor: "#8b5cf6",
        backgroundColor: isDark
          ? "rgba(139, 92, 246, 0.15)"
          : "rgba(139, 92, 246, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Savings Rate Trend — Last 6 Months",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` Savings Rate: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `${val}%`,
        },
        suggestedMin: 0,
      },
    },
  };

  const ratingLabel =
    avgRate >= 20
      ? { text: "Excellent", color: "text-green-600 dark:text-green-400" }
      : avgRate >= 10
        ? { text: "Good", color: "text-blue-600 dark:text-blue-400" }
        : avgRate >= 0
          ? {
              text: "Needs Improvement",
              color: "text-yellow-600 dark:text-yellow-400",
            }
          : { text: "Critical", color: "text-red-600 dark:text-red-400" };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          📊 Savings Rate
        </h2>
        <div className="text-right flex-shrink-0">
          <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {avgRate}%
          </p>
          <p className={`text-xs font-medium ${ratingLabel.color}`}>
            {ratingLabel.text} (Avg, 6 months)
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Financial experts recommend saving at least 20% of income
      </p>
      <Line data={data} options={options} />
    </div>
  );
}

// ─── 8. INCOME VS EXPENSE BALANCE ─────────────────────────
export function IncomeExpenseBalanceChart({ expenses, incomes }) {
  const { isDark } = useTheme();

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
    );
  }

  const getMonthTotal = (items, month) =>
    items
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .reduce((s, e) => s + e.amount, 0);

  const balances = months.map((m) => {
    const income = getMonthTotal(incomes, m);
    const expense = getMonthTotal(
      expenses.filter((e) => e.type === "expense"),
      m,
    );
    return income - expense;
  });

  const pointColors = balances.map((b) => (b >= 0 ? "#22c55e" : "#ef4444"));

  const data = {
    labels: months,
    datasets: [
      {
        label: "Balance (₹)",
        data: balances,
        borderColor: isDark ? "#60a5fa" : "#3b82f6",
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = canvasCtx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(34, 197, 94, 0.25)");
          gradient.addColorStop(0.5, "rgba(148, 163, 184, 0.1)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 0.25)");
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: pointColors,
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Income vs Expense Balance — Last 6 Months",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            return ` ${val >= 0 ? "Surplus" : "Deficit"}: ${val >= 0 ? "" : "-"}₹${Math.abs(val).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: {
          color: (ctx) => (ctx.tick.value === 0 ? tickColor : gridColor),
        },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  const totalBalance = balances.reduce((s, v) => s + v, 0);
  const isPositive = totalBalance >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          ⚖️ Income vs Expense
        </h2>
        <div className="text-right flex-shrink-0">
          <p
            className={`text-lg sm:text-2xl font-bold ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "" : "-"}₹{Math.abs(totalBalance).toLocaleString()}
          </p>
          <p
            className={`text-xs font-medium ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "Surplus (6 months)" : "Deficit (6 months)"}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Green line above zero = surplus, red below = deficit
      </p>
      <Line data={data} options={options} />
    </div>
  );
}

// ─── 9. EMI TO INCOME RATIO ───────────────────────────────
export function EMIIncomeRatioCard({ emis, incomes }) {
  const { isDark } = useTheme();

  const currentMonth = new Date().toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const monthlyIncome = incomes
    .filter((e) => {
      const m = new Date(e.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      return m === currentMonth;
    })
    .reduce((s, e) => s + e.amount, 0);

  const monthlyEMI = emis
    .filter((e) => e.isActive)
    .reduce((s, e) => s + e.emiAmount, 0);

  const ratio =
    monthlyIncome > 0 ? Math.round((monthlyEMI / monthlyIncome) * 100) : 0;

  const status =
    ratio === 0
      ? {
          label: "No EMIs",
          color: "#22c55e",
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "text-green-600 dark:text-green-400",
        }
      : ratio <= 20
        ? {
            label: "Healthy",
            color: "#22c55e",
            bg: "bg-green-50 dark:bg-green-900/20",
            text: "text-green-600 dark:text-green-400",
          }
        : ratio <= 40
          ? {
              label: "Manageable",
              color: "#eab308",
              bg: "bg-yellow-50 dark:bg-yellow-900/20",
              text: "text-yellow-600 dark:text-yellow-400",
            }
          : {
              label: "High Risk",
              color: "#ef4444",
              bg: "bg-red-50 dark:bg-red-900/20",
              text: "text-red-600 dark:text-red-400",
            };

  return (
    <div
      className={`rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 ${status.bg}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          🏦 EMI-to-Income Ratio
        </h2>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${status.bg} ${status.text} border`}
          style={{ borderColor: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <p
          className="text-3xl sm:text-4xl font-extrabold"
          style={{ color: status.color }}
        >
          {ratio}%
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          of monthly income
        </p>
      </div>

      <div
        style={{
          height: "14px",
          borderRadius: "9999px",
          overflow: "hidden",
          background: isDark ? "#374151" : "#e5e7eb",
          position: "relative",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            width: `${Math.min(ratio, 100)}%`,
            height: "100%",
            background: status.color,
            borderRadius: "9999px",
            transition: "width 0.7s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "40%",
            top: 0,
            bottom: 0,
            width: "2px",
            background: isDark ? "#6b7280" : "#9ca3af",
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>₹{monthlyEMI.toLocaleString()} EMI</span>
        <span>₹{monthlyIncome.toLocaleString()} Income</span>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {ratio <= 20
          ? "Your EMI burden is well within a healthy range (under 20%)."
          : ratio <= 40
            ? "Your EMI burden is manageable but keep an eye on it (20-40%)."
            : "Your EMI burden exceeds 40% of income — considered risky by most banks."}
      </p>
    </div>
  );
}
// ─── 10. SAVINGS TREND (₹ Amount) ─────────────────────────
export function SavingsTrendChart({ savings }) {
  const { isDark } = useTheme();

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
    );
  }

  const getMonthTotal = (items, month) =>
    items
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .reduce((s, e) => s + e.amount, 0);

  const savingsData = months.map((m) => getMonthTotal(savings, m));
  const totalSavings = savingsData.reduce((s, v) => s + v, 0);

  const data = {
    labels: months,
    datasets: [
      {
        label: "Savings (₹)",
        data: savingsData,
        borderColor: "#a855f7",
        backgroundColor: isDark
          ? "rgba(168, 85, 247, 0.15)"
          : "rgba(168, 85, 247, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#a855f7",
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Savings Trend — Last 6 Months",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          💰 Savings Trend
        </h2>
        <div className="text-right flex-shrink-0">
          <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            ₹{totalSavings.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total (6 months)
          </p>
        </div>
      </div>
      <Line data={data} options={options} />
    </div>
  );
}

// ─── 11. TOP SPENDING CATEGORIES ──────────────────────────
export function TopSpendingCategoriesCard({ expenses }) {
  const currentMonth = new Date().toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const getMonthCategoryTotals = (month) => {
    const map = {};
    expenses
      .filter((e) => e.type === "expense")
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .forEach((e) => {
        if (!map[e.category]) map[e.category] = 0;
        map[e.category] += e.amount;
      });
    return map;
  };

  const currentTotals = getMonthCategoryTotals(currentMonth);
  const lastTotals = getMonthCategoryTotals(lastMonth);

  const topCategories = Object.entries(currentTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxAmount = topCategories.length > 0 ? topCategories[0][1] : 1;

  const CATEGORY_EMOJIS = {
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

  if (topCategories.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
        🏆 Top Spending Categories
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        This month ({currentMonth}) vs last month
      </p>

      <div className="space-y-3">
        {topCategories.map(([category, amount], idx) => {
          const lastAmount = lastTotals[category] || 0;
          const change =
            lastAmount > 0
              ? Math.round(((amount - lastAmount) / lastAmount) * 100)
              : null;
          const widthPct = Math.round((amount / maxAmount) * 100);

          return (
            <div key={category}>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="flex-shrink-0">
                    {CATEGORY_EMOJIS[category] || "💰"}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">
                    ₹{amount.toLocaleString()}
                  </span>
                  {change !== null && (
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        change > 0
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  background: "rgba(148, 163, 184, 0.2)",
                }}
              >
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: "100%",
                    background: "#ef4444",
                    borderRadius: "9999px",
                    transition: "width 0.7s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 12. FINANCIAL HEALTH SCORE ───────────────────────────
export function FinancialHealthScoreCard({
  incomes,
  expenses,
  savings,
  budgets,
  emis,
}) {
  const currentMonth = new Date().toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const getMonthTotal = (items, month) =>
    items
      .filter((e) => {
        const m = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return m === month;
      })
      .reduce((s, e) => s + e.amount, 0);

  const monthlyIncome = getMonthTotal(incomes, currentMonth);
  const monthlySavings = getMonthTotal(savings, currentMonth);
  const monthlyEMI = emis
    .filter((e) => e.isActive)
    .reduce((s, e) => s + e.emiAmount, 0);

  const savingsRate =
    monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const savingsScore = Math.min(30, Math.round((savingsRate / 20) * 30));

  let budgetScore = 30;
  if (budgets.length > 0) {
    const exceededCount = budgets.filter((b) => b.status === "exceeded").length;
    const warningCount = budgets.filter((b) => b.status === "warning").length;
    const penalty = exceededCount * 10 + warningCount * 4;
    budgetScore = Math.max(0, 30 - penalty);
  }

  const emiRatio = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;
  let emiScore;
  if (emiRatio === 0) emiScore = 25;
  else if (emiRatio <= 20) emiScore = 25;
  else if (emiRatio <= 40) emiScore = 15;
  else emiScore = 5;

  const monthlyExpense = getMonthTotal(
    expenses.filter((e) => e.type === "expense"),
    currentMonth,
  );
  const balance = monthlyIncome - monthlyExpense;
  const balanceScore = balance >= 0 ? 15 : 0;

  const totalScore = savingsScore + budgetScore + emiScore + balanceScore;

  const rating =
    totalScore >= 80
      ? { label: "Excellent", color: "#22c55e", emoji: "🌟" }
      : totalScore >= 60
        ? { label: "Good", color: "#3b82f6", emoji: "👍" }
        : totalScore >= 40
          ? { label: "Fair", color: "#eab308", emoji: "⚠️" }
          : { label: "Needs Work", color: "#ef4444", emoji: "🚨" };

  const breakdown = [
    { label: "Savings Rate", score: savingsScore, max: 30 },
    { label: "Budget Control", score: budgetScore, max: 30 },
    { label: "EMI Burden", score: emiScore, max: 25 },
    { label: "Cash Flow", score: balanceScore, max: 15 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 lg:p-7 border border-transparent dark:border-gray-700">
      <div className="flex items-center justify-between mb-4 lg:mb-5">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-200">
          💯 Financial Health Score
        </h2>
        <span className="text-2xl lg:text-3xl">{rating.emoji}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 lg:gap-8 mb-5 lg:mb-6 text-center sm:text-left">
        <div
          style={{ position: "relative", width: "100px", height: "100px" }}
          className="sm:!w-[110px] sm:!h-[110px] lg:!w-[132px] lg:!h-[132px] flex-shrink-0"
        >
          {/* Desktop-only soft glow behind the ring for a bit of depth */}
          <div
            className="hidden lg:block"
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rating.color}22 0%, transparent 70%)`,
              zIndex: 0,
            }}
          />
          <svg
            width="100"
            height="100"
            viewBox="0 0 110 110"
            style={{ transform: "rotate(-90deg)", width: "100%", height: "100%", position: "relative", zIndex: 1 }}
          >
            <circle
              cx="55"
              cy="55"
              r="45"
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="10"
            />
            <circle
              cx="55"
              cy="55"
              r="45"
              fill="none"
              stroke={rating.color}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - totalScore / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <span
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
              style={{ color: rating.color, lineHeight: 1 }}
            >
              {totalScore}
            </span>
            <span className="text-xs lg:text-sm text-gray-400 dark:text-gray-500 lg:mt-0.5">
              / 100
            </span>
          </div>
        </div>

        <div>
          <p
            className="text-lg sm:text-xl lg:text-2xl font-bold"
            style={{ color: rating.color }}
          >
            {rating.label}
          </p>
          <p className="text-xs lg:text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-[220px] sm:max-w-[180px] lg:max-w-[240px]">
            Based on savings rate, budget adherence, EMI burden and cash flow
          </p>
        </div>
      </div>

      <div className="space-y-2.5 lg:space-y-3">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs lg:text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {item.score}/{item.max}
              </span>
            </div>
            <div
              style={{
                height: "6px",
                borderRadius: "9999px",
                overflow: "hidden",
                background: "rgba(148,163,184,0.2)",
              }}
              className="lg:!h-[7px]"
            >
              <div
                style={{
                  width: `${(item.score / item.max) * 100}%`,
                  height: "100%",
                  background: rating.color,
                  borderRadius: "9999px",
                  transition: "width 0.7s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 13. NET WORTH GROWTH (Historical Trend) ──────────────
export function NetWorthGrowthChart({ history, currentSnapshot }) {
  const { isDark } = useTheme();
  const [range, setRange] = useState("6m");

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";

  const currentMonth = new Date().toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  let allPoints = [...(history || [])];
  const hasCurrent = allPoints.some((p) => p.month === currentMonth);
  if (!hasCurrent && currentSnapshot) {
    allPoints.push({
      month: currentMonth,
      netWorth: currentSnapshot.netWorth,
    });
  }

  // Defensive sort — ensures chronological order regardless
  // of how the backend/DB returned the documents, so slicing
  // "last N months" always grabs the actually-most-recent ones
  allPoints = allPoints
    .filter((p) => !isNaN(new Date(`1 ${p.month}`)))
    .sort((a, b) => new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`));

  if (allPoints.length === 0) return null;

  // Apply the selected time range filter
  const getFilteredPoints = () => {
    if (range === "all") return allPoints;
    const monthsBack = range === "6m" ? 6 : 12;
    return allPoints.slice(-monthsBack);
  };

  const points = getFilteredPoints();

  const RANGE_OPTIONS = [
    { key: "6m", label: "6 Months" },
    { key: "1y", label: "1 Year" },
    { key: "all", label: "All Time" },
  ];

  if (points.length === 1) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
            📈 Net Worth Growth
          </h2>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  range === opt.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            ₹{points[0].netWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            First snapshot recorded this month.
            <br />
            Trend will build up as more months pass.
          </p>
        </div>
      </div>
    );
  }

  const data = {
    labels: points.map((p) => p.month),
    datasets: [
      {
        label: "Net Worth (₹)",
        data: points.map((p) => p.netWorth),
        borderColor: "#3b82f6",
        backgroundColor: isDark
          ? "rgba(59, 130, 246, 0.15)"
          : "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: points.map((p) =>
          p.netWorth >= 0 ? "#3b82f6" : "#f97316",
        ),
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        offset: true,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  const firstValue = points[0].netWorth;
  const lastValue = points[points.length - 1].netWorth;
  const growth =
    firstValue !== 0
      ? Math.round(((lastValue - firstValue) / Math.abs(firstValue)) * 100)
      : null;

  const minChartWidth = Math.max(320, points.length * 70);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          📈 Net Worth Growth
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {growth !== null && (
            <span
              className={`text-xs sm:text-sm font-bold ${
                growth >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}% since{" "}
              {points[0].month}
            </span>
          )}
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  range === opt.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "relative", overflowX: "auto" }}>
        <div
          style={{
            position: "relative",
            height: "280px",
            minWidth: `${minChartWidth}px`,
          }}
        >
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 14. EMI COMPARISON (Total / Paid / Outstanding) ──────
export function EMILineComparisonChart({ emis }) {
  const { isDark } = useTheme();
  const activeEMIs = emis?.filter((e) => e.isActive) || [];
  if (activeEMIs.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const labels = activeEMIs.map((e) => e.name);
  const totalValues = activeEMIs.map((e) => e.totalAmount);
  const paidValues = activeEMIs.map((e) => e.paidMonths * e.emiAmount);
  const outstandingValues = activeEMIs.map(
    (e) => (e.tenureMonths - e.paidMonths) * e.emiAmount,
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Total Loan Amount",
        data: totalValues,
        showLine: false,
        borderColor: "transparent",
        backgroundColor: "transparent",
        pointBackgroundColor: "#94a3b8",
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: "rectRot",
      },
      {
        label: "Amount Paid",
        data: paidValues,
        showLine: false,
        borderColor: "transparent",
        backgroundColor: "transparent",
        pointBackgroundColor: "#22c55e",
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: "Amount Outstanding",
        data: outstandingValues,
        showLine: false,
        borderColor: "transparent",
        backgroundColor: "transparent",
        pointBackgroundColor: "#ef4444",
        pointBorderColor: isDark ? "#1f2937" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };

  const maxValue = Math.max(...totalValues, 1);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 4, right: 12, bottom: 4, left: 4 },
    },
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          color: legendColor,
          font: { size: 11 },
          padding: 8,
          boxWidth: 16,
        },
      },
      title: {
        display: true,
        text: "Total Loan vs Paid vs Outstanding",
        color: titleColor,
        font: { size: 14, weight: "600" },
        padding: { top: 0, bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        offset: true,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
        suggestedMax: maxValue * 1.1,
      },
    },
  };

  // Same horizontal-scroll pattern as EMICategoryComparisonChart:
  // on narrow (mobile) containers this triggers a scrollbar so
  // labels/points never overlap or get skipped; on wide (desktop)
  // containers this minWidth is smaller than the card's natural
  // width, so it has zero visual effect there.
  const minChartWidth = Math.max(320, activeEMIs.length * 180);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "400px" }}
    >
      <div style={{ position: "relative", flex: 1, overflowX: "auto" }}>
        <div
          style={{
            position: "relative",
            height: "100%",
            minWidth: `${minChartWidth}px`,
          }}
        >
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

/// ─── 15. EMI CATEGORY COMPARISON (Total vs Paid vs Outstanding) ──
export function EMICategoryComparisonChart({ emis }) {
  const { isDark } = useTheme();
  const activeEMIs = emis?.filter((e) => e.isActive) || [];
  if (activeEMIs.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const categoryMap = {};
  activeEMIs.forEach((e) => {
    if (!categoryMap[e.category])
      categoryMap[e.category] = { total: 0, paid: 0, outstanding: 0 };
    const paid = e.paidMonths * e.emiAmount;
    const outstanding = (e.tenureMonths - e.paidMonths) * e.emiAmount;
    categoryMap[e.category].total += e.totalAmount;
    categoryMap[e.category].paid += paid;
    categoryMap[e.category].outstanding += outstanding;
  });

  const labels = Object.keys(categoryMap);
  const totalData = labels.map((c) => categoryMap[c].total);
  const paidData = labels.map((c) => categoryMap[c].paid);
  const outstandingData = labels.map((c) => categoryMap[c].outstanding);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Amount",
        data: totalData,
        backgroundColor: isDark ? "#374151" : "#e5e7eb",
        borderRadius: 4,
      },
      {
        label: "Amount Paid",
        data: paidData,
        backgroundColor: "#22c55e",
        borderRadius: 4,
      },
      {
        label: "Amount Outstanding",
        data: outstandingData,
        backgroundColor: "#ef4444",
        borderRadius: 4,
      },
    ],
  };

  const maxValue = Math.max(...totalData, 1);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 0, right: 8, bottom: 4, left: 4 } },
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 }, padding: 8 },
      },
      title: {
        display: true,
        text: "EMI by Category — Total vs Paid vs Outstanding",
        color: titleColor,
        font: { size: 13 },
        padding: { top: 0, bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
        suggestedMax: maxValue * 1.15,
      },
    },
  };

  // Once category count grows beyond a comfortable width,
  // let the chart scroll horizontally instead of cramming
  const minChartWidth = Math.max(320, labels.length * 160);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "400px" }}
    >
      <div style={{ position: "relative", flex: 1, overflowX: "auto" }}>
        <div
          style={{
            position: "relative",
            height: "100%",
            minWidth: `${minChartWidth}px`,
          }}
        >
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 16. BILLS STATUS DONUT (Compact, matches calendar) ───
export function BillsStatusDonutCompact({ bills }) {
  const { isDark } = useTheme();
  if (!bills || bills.length === 0) return null;

  const paid     = bills.filter(b => b.status === 'paid').length;
  const overdue  = bills.filter(b => b.status === 'overdue').length;
  const dueSoon  = bills.filter(b => b.status === 'due-today' || b.status === 'due-soon').length;
  const upcoming = bills.filter(b => b.status === 'upcoming').length;

  const tooltipBg   = isDark ? '#1f2937' : '#ffffff';
  const tooltipText = isDark ? '#f9fafb' : '#111827';
  const gridColor   = isDark ? '#374151' : '#e5e7eb';
  const legendColor = isDark ? '#d1d5db' : '#374151';
  const titleColor  = isDark ? '#f9fafb' : '#111827';

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const paidAmount   = bills
    .filter(b => b.status === 'paid')
    .reduce((s, b) => s + b.amount, 0);

  const labels = []; const values = []; const colors = [];
  const map = [
    { l: 'Paid',     v: paid,     c: '#22c55e' },
    { l: 'Overdue',  v: overdue,  c: '#ef4444' },
    { l: 'Due Soon', v: dueSoon,  c: '#eab308' },
    { l: 'Upcoming', v: upcoming, c: '#94a3b8' }
  ];
  map.forEach(m => {
    if (m.v > 0) { labels.push(m.l); values.push(m.v); colors.push(m.c); }
  });

  const data = {
    labels,
    datasets: [{
      data:            values,
      backgroundColor: colors,
      borderWidth:     values.length > 1 ? 2 : 0,
      borderColor:     isDark ? '#1f2937' : '#ffffff',
      hoverOffset:     6
    }]
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color:   legendColor,
          padding: 8,
          font:    { size: 10 },
          boxWidth: 8
        }
      },
      title: {
        display: true,
        text:    'Bills Status',
        color:   titleColor,
        font:    { size: 12 }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor:      tooltipText,
        bodyColor:       tooltipText,
        borderColor:     gridColor,
        borderWidth:     1,
        callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.raw}`
        }
      }
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: '400px' }}
    >
      <div className="flex justify-between text-xs mb-3">
        <div>
          <p className="text-gray-400 dark:text-gray-500">Monthly</p>
          <p className="font-bold text-gray-800 dark:text-white">
            ₹{totalMonthly.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 dark:text-gray-500">Paid</p>
          <p className="font-bold text-green-600 dark:text-green-400">
            ₹{paidAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <Doughnut data={data} options={options} />
      </div>

      <div className="grid grid-cols-4 gap-1 mt-4">
        {[
          { l: 'Paid',    v: paid,     c: 'text-green-600 dark:text-green-400'   },
          { l: 'Overdue', v: overdue,  c: 'text-red-600 dark:text-red-400'       },
          { l: 'Soon',    v: dueSoon,  c: 'text-yellow-600 dark:text-yellow-400' },
          { l: 'Later',   v: upcoming, c: 'text-gray-500 dark:text-gray-400'     }
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 17. BILLS CATEGORY PIE (like Expense page) ───────────
export function BillsCategoryPieChart({ bills }) {
  const { isDark } = useTheme();
  if (!bills || bills.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const categoryMap = {};
  bills.forEach((b) => {
    if (!categoryMap[b.category]) categoryMap[b.category] = 0;
    categoryMap[b.category] += b.amount;
  });
  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  const total = values.reduce((s, v) => s + v, 0);

  const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ef4444",
    "#eab308",
    "#f97316",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#94a3b8",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: labels.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 12, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Bills by Category",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div className="max-w-xs mx-auto">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

/// ─── 18. BILLS MONTHLY TREND ──────────────────────────────
export function BillsMonthlyTrendChart({ bills }) {
  const { isDark } = useTheme();
  if (!bills || bills.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", { month: "short", year: "numeric" }),
      endOfMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const monthlyTotals = months.map((m) =>
    bills
      .filter((b) => !b.createdAt || new Date(b.createdAt) <= m.endOfMonth)
      .reduce((s, b) => s + b.amount, 0),
  );

  const data = {
    labels: months.map((m) => m.label),
    datasets: [
      {
        label: "Total Bills (₹)",
        data: monthlyTotals,
        backgroundColor: "#f97316",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Monthly Bills Trend",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div style={{ position: "relative", height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── 19. BILLS CATEGORY VS MONTH ──────────────────────────
export function BillsCategoryMonthChart({ bills }) {
  const { isDark } = useTheme();
  if (!bills || bills.length === 0) return null;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", { month: "short", year: "numeric" }),
      endOfMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const categories = [...new Set(bills.map((b) => b.category))];
  const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ef4444",
    "#eab308",
    "#f97316",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#94a3b8",
  ];

  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: months.map((m) =>
      bills
        .filter(
          (b) =>
            b.category === cat &&
            (!b.createdAt || new Date(b.createdAt) <= m.endOfMonth),
        )
        .reduce((s, b) => s + b.amount, 0),
    ),
    backgroundColor: COLORS[i % COLORS.length],
    borderRadius: 4,
  }));

  const data = { labels: months.map((m) => m.label), datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: legendColor,
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
      title: {
        display: true,
        text: "Bills — Category vs Month",
        color: titleColor,
        font: { size: 13 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700">
      <div style={{ position: "relative", height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── 20. PAYMENT PUNCTUALITY SCORE ────────────────────────
export function PaymentPunctualityCard({ bills }) {
  if (!bills || bills.length === 0) return null;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const allEntries = [];
  bills.forEach((bill) => {
    (bill.paymentHistory || []).forEach((entry) => {
      allEntries.push({ ...entry, billName: bill.name });
    });
  });

  const recentEntries = allEntries.filter((entry) => {
    const parsed = new Date(`1 ${entry.month}`);
    return !isNaN(parsed) && parsed >= threeMonthsAgo;
  });

  if (recentEntries.length === 0) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col justify-center items-center text-center"
        style={{ height: "400px" }}
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          ⏱️ Payment Punctuality
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No payment history yet.
          <br />
          Mark bills as paid to start tracking your punctuality score.
        </p>
      </div>
    );
  }

  const onTimeCount = recentEntries.filter((e) => e.onTime).length;
  const lateCount = recentEntries.length - onTimeCount;
  const punctualityPct = Math.round((onTimeCount / recentEntries.length) * 100);

  const status =
    punctualityPct >= 90
      ? { label: "Excellent", color: "#22c55e", emoji: "🌟" }
      : punctualityPct >= 70
        ? { label: "Good", color: "#3b82f6", emoji: "👍" }
        : punctualityPct >= 50
          ? { label: "Fair", color: "#eab308", emoji: "⚠️" }
          : { label: "Poor", color: "#ef4444", emoji: "🚨" };

  // Show ALL recent entries (up to 3 months, already filtered
  // above) — no artificial cap. The list container is already
  // scrollable, so this is safe even with many entries.
  // Secondary sort by paidOnDay keeps same-month entries in a
  // sensible order instead of relying on unstable tie-breaking.
  const sortedEntries = [...recentEntries].sort((a, b) => {
    const monthDiff = new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`);
    if (monthDiff !== 0) return monthDiff;
    return (a.paidOnDay || 0) - (b.paidOnDay || 0);
  });

  const uniqueBillsTracked = new Set(recentEntries.map((e) => e.billName)).size;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 lg:p-7 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "400px" }}
    >
      <div className="flex items-center justify-between mb-2 lg:mb-3 flex-shrink-0">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-200">
          ⏱️ Payment Punctuality
        </h2>
        <span className="text-2xl lg:text-3xl">{status.emoji}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 lg:gap-6 mb-3 lg:mb-4 text-center sm:text-left flex-shrink-0">
        <div
          style={{
            position: "relative",
            width: "64px",
            height: "64px",
            flexShrink: 0,
          }}
          className="sm:!w-[72px] sm:!h-[72px] lg:!w-[80px] lg:!h-[80px]"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 104 104"
            style={{
              transform: "rotate(-90deg)",
              width: "100%",
              height: "100%",
            }}
          >
            <circle
              cx="52"
              cy="52"
              r="42"
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="10"
            />
            <circle
              cx="52"
              cy="52"
              r="42"
              fill="none"
              stroke={status.color}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - punctualityPct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="text-base sm:text-lg lg:text-xl font-extrabold"
              style={{ color: status.color }}
            >
              {punctualityPct}%
            </span>
          </div>
        </div>

        <div>
          <p
            className="text-sm sm:text-base lg:text-lg font-bold"
            style={{ color: status.color }}
          >
            {status.label}
          </p>
          <p className="text-[11px] lg:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Based on last 3 months of bill payments
          </p>
          <p className="hidden lg:block text-[11px] text-gray-400 dark:text-gray-500">
            {uniqueBillsTracked} bill{uniqueBillsTracked !== 1 ? "s" : ""}{" "}
            tracked · {recentEntries.length} payment
            {recentEntries.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-3 lg:mb-4 flex-shrink-0">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg py-2 lg:py-2.5 px-2 text-center border border-green-100 dark:border-green-900/30">
          <p className="text-base sm:text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">
            {onTimeCount}
          </p>
          <p className="text-[11px] lg:text-xs text-gray-500 dark:text-gray-400">
            On Time
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg py-2 lg:py-2.5 px-2 text-center border border-red-100 dark:border-red-900/30">
          <p className="text-base sm:text-lg lg:text-xl font-bold text-red-600 dark:text-red-400">
            {lateCount}
          </p>
          <p className="text-[11px] lg:text-xs text-gray-500 dark:text-gray-400">
            Late
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <p className="text-[11px] lg:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex-shrink-0">
          Recent Payments
        </p>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {sortedEntries
            .slice()
            .reverse()
            .map((entry, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-1 px-2 py-1.5 lg:px-3 lg:py-2 bg-gray-50 dark:bg-gray-700/50 rounded lg:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.onTime ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <p className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {entry.billName}
                  </p>
                </div>
                <span
                  className={`text-xs lg:text-sm font-medium flex-shrink-0 ${entry.onTime ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {entry.onTime ? "On Time" : "Late"} • {entry.month}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── 21. ASSETS CATEGORY PIE ──────────────────────────────
export function AssetsCategoryPieChart({ netWorthData }) {
  const { isDark } = useTheme();
  if (!netWorthData) return null;

  const allAssets = [
    ...(netWorthData.breakdown?.autoAssets || []),
    ...(netWorthData.breakdown?.manualAssets || []),
  ];
  if (allAssets.length === 0) return null;

  const categoryMap = {};
  allAssets.forEach((a) => {
    if (!categoryMap[a.category]) categoryMap[a.category] = 0;
    categoryMap[a.category] += a.value;
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  const total = values.reduce((s, v) => s + v, 0);

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#eab308",
    "#f97316",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: labels.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Assets by Category",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "100%", maxWidth: "260px", height: "100%" }}>
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 22. LIABILITIES CATEGORY PIE ─────────────────────────
export function LiabilitiesCategoryPieChart({ netWorthData }) {
  const { isDark } = useTheme();
  if (!netWorthData) return null;

  const allLiabilities = [
    ...(netWorthData.breakdown?.autoLiabilities || []),
    ...(netWorthData.breakdown?.manualLiabilities || []),
  ];
  if (allLiabilities.length === 0) return null;

  const categoryMap = {};
  allLiabilities.forEach((l) => {
    if (!categoryMap[l.category]) categoryMap[l.category] = 0;
    categoryMap[l.category] += l.value;
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  const total = values.reduce((s, v) => s + v, 0);

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#ec4899",
    "#a855f7",
    "#3b82f6",
    "#06b6d4",
    "#84cc16",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: labels.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Liabilities by Category",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "100%", maxWidth: "260px", height: "100%" }}>
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 23. NET WORTH DIVERGING CHART ────────────────────────
export function NetWorthDivergingChart({ netWorthData }) {
  const { isDark } = useTheme();
  if (!netWorthData) return null;

  const { netWorth = 0, totalAssets = 0, totalLiabilities = 0 } = netWorthData;

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  const netWorthPositive = netWorth >= 0;

  const data = {
    labels: ["Assets", "Liabilities", "Net Worth"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [totalAssets, -totalLiabilities, netWorth],
        backgroundColor: [
          "#22c55e",
          "#ef4444",
          netWorthPositive ? "#3b82f6" : "#f97316",
        ],
        borderRadius: 6,
      },
    ],
  };

  const maxRange = Math.max(
    totalAssets,
    totalLiabilities,
    Math.abs(netWorth),
    1,
  );

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Assets vs Liabilities vs Net Worth",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            return ` ₹${Math.abs(val).toLocaleString()}${val < 0 ? " (liability)" : ""}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${Math.abs(val).toLocaleString()}`,
        },
        suggestedMin: -maxRange * 1.15,
        suggestedMax: maxRange * 1.15,
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1" style={{ position: "relative" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── 24. NET WORTH PROGRESS BAR ────────────────────────────
export function NetWorthProgressBarCard({ netWorthData }) {
  const { isDark } = useTheme();
  if (!netWorthData) return null;

  const { totalAssets = 0, totalLiabilities = 0 } = netWorthData;

  const assetPct =
    totalAssets + totalLiabilities > 0
      ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)
      : 100;

  const debtToAssetRatio =
    totalAssets > 0
      ? totalLiabilities / totalAssets
      : totalLiabilities > 0
        ? Infinity
        : 0;

  const verdict =
    debtToAssetRatio === 0
      ? {
          text: "No liabilities — fully debt-free",
          emoji: "🎉",
          color: "#22c55e",
        }
      : debtToAssetRatio < 1
        ? {
            text: "Healthy — assets exceed liabilities",
            emoji: "✅",
            color: "#22c55e",
          }
        : debtToAssetRatio <= 3
          ? {
              text: "Manageable — some debt burden",
              emoji: "⚠️",
              color: "#eab308",
            }
          : {
              text: "Concerning — liabilities significantly outweigh assets",
              emoji: "🚨",
              color: "#ef4444",
            };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-6">
        Assets vs Liabilities Ratio
      </p>

      {/* Progress bar */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-green-600 dark:text-green-400 font-medium">
          Assets {assetPct}%
        </span>
        <span className="text-red-600 dark:text-red-400 font-medium">
          Liabilities {100 - assetPct}%
        </span>
      </div>
      <div
        style={{
          height: "20px",
          borderRadius: "9999px",
          overflow: "hidden",
          background: "#fee2e2",
        }}
      >
        <div
          style={{
            width: `${assetPct}%`,
            height: "100%",
            background: "#22c55e",
            borderRadius: "9999px 0 0 9999px",
            transition: "width 0.7s ease",
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2 text-gray-400 dark:text-gray-500">
        <span>₹{totalAssets.toLocaleString()}</span>
        <span>₹{totalLiabilities.toLocaleString()}</span>
      </div>

      {/* Spacer to push ratio card toward bottom, filling space */}
      <div className="flex-1" />

      {/* Debt-to-Asset Ratio + verdict */}
      <div
        className="rounded-lg p-4"
        style={{
          background: isDark ? `${verdict.color}20` : `${verdict.color}15`,
          border: `1px solid ${verdict.color}40`,
        }}
      >
        <div className="flex items-center justify-between mb-2 gap-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Debt-to-Asset Ratio
          </p>
          <p
            className="text-base sm:text-lg font-extrabold flex-shrink-0"
            style={{ color: verdict.color }}
          >
            {debtToAssetRatio === Infinity
              ? "∞"
              : `${debtToAssetRatio.toFixed(1)}x`}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {verdict.emoji} {verdict.text}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
          This ratio shows how much debt you carry relative to what you own. A
          lower ratio means stronger financial footing.
        </p>
      </div>
    </div>
  );
}

// ─── 25. BUDGET STATUS DONUT ───────────────────────────────
export function BudgetStatusDonutChart({ budgets }) {
  const { isDark } = useTheme();
  if (!budgets || budgets.length === 0) return null;

  const safe = budgets.filter((b) => b.status === "safe").length;
  const warning = budgets.filter((b) => b.status === "warning").length;
  const exceeded = budgets.filter((b) => b.status === "exceeded").length;

  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const legendColor = isDark ? "#d1d5db" : "#374151";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  const labels = [];
  const values = [];
  const colors = [];
  const map = [
    { l: "Safe", v: safe, c: "#22c55e" },
    { l: "Warning", v: warning, c: "#eab308" },
    { l: "Exceeded", v: exceeded, c: "#ef4444" },
  ];
  map.forEach((m) => {
    if (m.v > 0) {
      labels.push(m.l);
      values.push(m.v);
      colors.push(m.c);
    }
  });

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: values.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Budget Status Overview",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.raw} categor${ctx.raw !== 1 ? "ies" : "y"}`,
        },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "100%", maxWidth: "240px", height: "100%" }}>
          <Doughnut data={data} options={options} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { l: "Safe", v: safe, c: "text-green-600 dark:text-green-400" },
          {
            l: "Warning",
            v: warning,
            c: "text-yellow-600 dark:text-yellow-400",
          },
          { l: "Exceeded", v: exceeded, c: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className={`text-base sm:text-lg font-bold ${s.c}`}>{s.v}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 26. CATEGORY SPENDING SHARE PIE ──────────────────────
export function CategorySpendingSharePieChart({ budgets }) {
  const { isDark } = useTheme();
  if (!budgets || budgets.length === 0) return null;

  const validBudgets = budgets.filter((b) => b.spent > 0);
  if (validBudgets.length === 0) return null;

  const labels = validBudgets.map((b) => b.category);
  const values = validBudgets.map((b) => b.spent);
  const total = values.reduce((s, v) => s + v, 0);

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#22c55e",
    "#a855f7",
    "#eab308",
    "#f97316",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#94a3b8",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: labels.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Spending Share by Category",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "100%", maxWidth: "240px", height: "100%" }}>
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 27. GOALS CONTRIBUTION PIE ────────────────────────────
export function GoalsContributionPieChart({ goals }) {
  const { isDark } = useTheme();
  if (!goals || goals.length === 0) return null;

  const validGoals = goals.filter((g) => g.currentAmount > 0);
  if (validGoals.length === 0) return null;

  const labels = validGoals.map((g) => g.title);
  const values = validGoals.map((g) => g.currentAmount);
  const total = values.reduce((s, v) => s + v, 0);

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const titleColor = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";

  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#eab308",
    "#f97316",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#94a3b8",
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: labels.length > 1 ? 2 : 0,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: legendColor, padding: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Savings Contribution by Goal",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "100%", maxWidth: "240px", height: "100%" }}>
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

// ─── 28. GOALS TIMELINE (Start → Deadline with Progress) ──
export function GoalsTimelineChart({ goals }) {
  const { isDark } = useTheme();
  if (!goals || goals.length === 0) return null;

  
  const textColor = isDark ? "#d1d5db" : "#374151";

  const today = new Date();

  // Prepare timeline data for up to 6 goals
  const timelineGoals = goals.slice(0, 6).map((goal) => {
    const start = new Date(goal.createdAt || goal.startDate || today);
    const deadline = new Date(goal.deadline);
    const totalSpan = deadline - start;
    const elapsed = today - start;

    const timeProgressPct =
      totalSpan > 0
        ? Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)))
        : 100;

    const savingsProgressPct = Math.min(
      100,
      Math.round((goal.currentAmount / goal.targetAmount) * 100),
    );

    const isOverdue = today > deadline && !goal.isCompleted;
    const isCompleted = goal.isCompleted;

    // On track if savings % >= time % (roughly)
    const isOnTrack = savingsProgressPct >= timeProgressPct - 10;

    return {
      ...goal,
      timeProgressPct,
      savingsProgressPct,
      isOverdue,
      isCompleted,
      isOnTrack,
      startLabel: start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      deadlineLabel: deadline.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  });

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "380px" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          🗓️ Goals Timeline
        </h2>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Savings %</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">
              Time Elapsed
            </span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {timelineGoals.map((goal) => (
          <div key={goal._id}>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[55%]">
                {goal.title}
              </p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  goal.isCompleted
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : goal.isOverdue
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      : goal.isOnTrack
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {goal.isCompleted
                  ? "✅ Done"
                  : goal.isOverdue
                    ? "⚠️ Overdue"
                    : goal.isOnTrack
                      ? "On Track"
                      : "Behind"}
              </span>
            </div>

            {/* Dual bars: time elapsed (background) + savings progress (foreground) */}
            <div
              style={{
                position: "relative",
                height: "14px",
                borderRadius: "9999px",
                overflow: "hidden",
                background: isDark ? "#374151" : "#f1f5f9",
              }}
            >
              {/* Time elapsed marker bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${goal.timeProgressPct}%`,
                  background: isDark
                    ? "rgba(148,163,184,0.35)"
                    : "rgba(148,163,184,0.5)",
                  borderRadius: "9999px",
                }}
              />
              {/* Savings progress bar (foreground, slightly shorter height for layering) */}
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: 0,
                  height: "8px",
                  width: `${goal.savingsProgressPct}%`,
                  background: goal.isCompleted
                    ? "#22c55e"
                    : goal.isOnTrack
                      ? "#3b82f6"
                      : "#eab308",
                  borderRadius: "9999px",
                  transition: "width 0.7s ease",
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              <span>{goal.startLabel}</span>
              <span className="font-medium" style={{ color: textColor }}>
                {goal.savingsProgressPct}% saved
              </span>
              <span>{goal.deadlineLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {goals.length > 6 && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
          Showing 6 of {goals.length} goals
        </p>
      )}
    </div>
  );
}
