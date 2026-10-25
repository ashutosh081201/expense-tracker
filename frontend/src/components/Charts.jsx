import { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { useTheme } from "../context/useTheme";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#7BC8A4",
  "#E8C3B9",
  "#B4E0E0",
];

function Charts({
  categoryStats,
  monthlyStats,
  categoryMonthData,
  months,
  activeTab,
}) {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [highlightedCat, setHighlightedCat] = useState(null);
  const { isDark } = useTheme();

  // Safety checks
  if (!categoryStats) return null;
  if (!monthlyStats) return null;
  if (!categoryMonthData) return null;
  if (!months || months.length === 0) return null;
  if (Object.keys(categoryStats).length === 0) return null;

  // Dark mode chart colors
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#d1d5db" : "#374151";
  const titleColor = isDark ? "#f9fafb" : "#111827";

  // Tab color
  const tabColor =
    {
      expenses: "#FF6384",
      income: "#4BC0C0",
      savings: "#9966FF",
    }[activeTab] || "#36A2EB";

  const tabLabel =
    {
      expenses: "Expenses",
      income: "Income",
      savings: "Savings",
    }[activeTab] || "";

  // --- Pie Chart ---
  const getPieData = () => {
    if (selectedMonth === "All") {
      return {
        labels: Object.keys(categoryStats),
        values: Object.values(categoryStats),
      };
    }
    const labels = [];
    const values = [];
    Object.entries(categoryMonthData).forEach(([cat, monthData]) => {
      const amount = monthData[selectedMonth] || 0;
      if (amount > 0) {
        labels.push(cat);
        values.push(amount);
      }
    });
    return { labels, values };
  };

  const { labels: pieLabels, values: pieValues } = getPieData();

  const getPiePercent = () => {
    const total = pieValues.reduce((s, v) => s + v, 0);
    const pct = {};
    pieLabels.forEach((label, i) => {
      pct[label] =
        total > 0 ? ((pieValues[i] / total) * 100).toFixed(1) : "0.0";
    });
    return pct;
  };

  const piePercent = getPiePercent();

  const pieColors = pieLabels.map((label, i) => {
    if (!highlightedCat) return COLORS[i % COLORS.length];
    return highlightedCat === label
      ? COLORS[i % COLORS.length]
      : COLORS[i % COLORS.length] + "33";
  });

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        backgroundColor: pieColors,
        borderWidth: pieLabels.length === 1 ? 0 : 2,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        hoverOffset: 10,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clicked = pieLabels[elements[0].index];
        setHighlightedCat((prev) => (prev === clicked ? null : clicked));
      } else {
        setHighlightedCat(null);
      }
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: legendColor,
          padding: 12,
          font: { size: 11 },
          boxWidth: 12,
        },
        onClick: (e, legendItem) => {
          const label = legendItem.text;
          setHighlightedCat((prev) => (prev === label ? null : label));
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: gridColor,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const pct = piePercent[ctx.label] || 0;
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  // --- Monthly Bar ---
  const barData = {
    labels: Object.keys(monthlyStats),
    datasets: [
      {
        label: `${tabLabel} (₹)`,
        data: Object.values(monthlyStats),
        backgroundColor: tabColor,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: legendColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: `Monthly ${tabLabel} Trend`,
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

  // --- Category vs Month ---
  const categoryList = Object.keys(categoryMonthData);

  const groupedBarData = {
    labels: months,
    datasets: categoryList.map((cat, i) => ({
      label: cat,
      data: months.map((m) => categoryMonthData[cat]?.[m] || 0),
      backgroundColor: highlightedCat
        ? highlightedCat === cat
          ? COLORS[i % COLORS.length]
          : COLORS[i % COLORS.length] + "30"
        : COLORS[i % COLORS.length],
      borderRadius: 4,
    })),
  };

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: legendColor,
          boxWidth: 12,
          padding: 16,
          font: { size: 11 },
        },
        onClick: (e, legendItem) => {
          const label = legendItem.text;
          setHighlightedCat((prev) => (prev === label ? null : label));
        },
      },
      title: {
        display: true,
        text: `${tabLabel} — Category vs Month`,
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
        stacked: false,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        stacked: false,
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (val) => `₹${val.toLocaleString()}`,
        },
      },
    },
  };

  const cardClass =
    "bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-transparent dark:border-gray-700";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Row 1 — Pie + Monthly Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <div className={cardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
              {tabLabel} by Category
            </h2>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setHighlightedCat(null);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
            >
              <option value="All">Last 6 Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-center">
            Click a slice or row to highlight
          </p>

          {pieValues.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-12">
              <p>No data for {selectedMonth}</p>
            </div>
          ) : (
            <>
              {/* % Bars */}
              <div className="mb-4 space-y-2">
                {pieLabels.map((label, i) => {
                  const isActive = !highlightedCat || highlightedCat === label;
                  return (
                    <div
                      key={label}
                      onClick={() =>
                        setHighlightedCat((prev) =>
                          prev === label ? null : label,
                        )
                      }
                      className="cursor-pointer"
                      style={{
                        opacity: isActive ? 1 : 0.3,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <div className="flex flex-wrap justify-between gap-1 text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                          {label}
                        </span>
                        <span
                          className="font-bold whitespace-nowrap"
                          style={{ color: COLORS[i % COLORS.length] }}
                        >
                          {piePercent[label]}% — ₹
                          {pieValues[i].toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${piePercent[label]}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                            height: "100%",
                            borderRadius: "9999px",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {highlightedCat && (
                <button
                  onClick={() => setHighlightedCat(null)}
                  className="text-xs text-blue-500 hover:underline mb-2 block mx-auto"
                >
                  Clear selection
                </button>
              )}

              <div className="max-w-xs mx-auto">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </>
          )}
        </div>

        {/* Monthly Trend */}
        <div className={cardClass}>
          <div style={{ position: "relative", height: "300px" }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Row 2 — Category vs Month */}
      {categoryList.length > 0 && (
        <div className={cardClass}>
          {highlightedCat && (
            <p className="text-xs sm:text-sm font-normal text-blue-500 mb-2 sm:hidden">
              — {highlightedCat} highlighted
            </p>
          )}
          <div style={{ position: "relative", height: "300px" }}>
            <Bar data={groupedBarData} options={groupedBarOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Charts;
