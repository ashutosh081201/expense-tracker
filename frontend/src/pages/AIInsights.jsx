import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PERIOD_OPTIONS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "this-year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

const TABS = [
  { key: "overview", label: "📊 Overview", dataKey: null },
  { key: "spending", label: "💸 Expenses", dataKey: "spending" },
  { key: "savings", label: "💰 Savings", dataKey: "savings" },
  { key: "budget", label: "💳 Budget", dataKey: "budget" },
  { key: "goals", label: "🎯 Goals", dataKey: "goals" },
  { key: "billsAndEmi", label: "🏦 EMI & Bills", dataKey: "billsAndEmi" },
  { key: "netWorth", label: "📈 Net Worth", dataKey: "netWorth" },
  { key: "predictions", label: "🔮 Predictions", dataKey: "predictions" },
];

function InsightList({ items, emptyMessage }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10">
        <p className="text-4xl mb-2">🤔</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 px-4">
          {emptyMessage || "No specific insights for this category yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((text, idx) => (
        <div
          key={idx}
          className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <span className="text-base sm:text-lg flex-shrink-0">💡</span>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}

function AIInsights() {
  const [periodType, setPeriodType] = useState("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleGenerate = async () => {
    if (periodType === "custom" && (!customStart || !customEnd)) {
      return toast.error("Please select both start and end dates");
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ periodType });
      if (periodType === "custom") {
        params.append("startDate", customStart);
        params.append("endDate", customEnd);
      }

      const res = await api.get(`/ai-insights/generate?${params.toString()}`);
      setResult(res.data);
      setActiveTab("overview");
      toast.success("AI Insights generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        🤖 AI Insights
      </h1>

      {/* Configuration Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Generate Insights
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          AI-powered analysis of your financial data for any period
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Period
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriodType(opt.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
                  periodType === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {periodType === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded transition font-medium disabled:opacity-50 text-sm"
        >
          {loading
            ? "✨ Analyzing your finances..."
            : "✨ Generate AI Insights"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow border border-transparent dark:border-gray-700 text-center">
              <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                {result.summary.healthScore}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Health Score
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow border border-transparent dark:border-gray-700 text-center">
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                ₹{result.summary.totalIncome.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Income
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow border border-transparent dark:border-gray-700 text-center">
              <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                ₹{result.summary.totalExpense.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Expenses
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow border border-transparent dark:border-gray-700 text-center">
              <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                ₹{result.summary.totalSavings.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Savings
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow border border-transparent dark:border-gray-700 text-center col-span-2 sm:col-span-1">
              <p
                className={`text-base sm:text-lg font-bold ${
                  result.summary.netWorth >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                ₹{Math.abs(result.summary.netWorth).toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Net Worth
              </p>
            </div>
          </div>

          {/* Period Label */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
            Insights for {result.period.label}
          </p>

          {/* Tab Switcher */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition border ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    💸 Spending
                  </h3>
                  <InsightList items={result.insights.spending} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    💰 Savings
                  </h3>
                  <InsightList items={result.insights.savings} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    💯 Health Score
                  </h3>
                  <InsightList items={result.insights.healthScore} />
                </div>
              </div>
            )}

            {activeTab === "spending" && (
              <InsightList
                items={result.insights.spending}
                emptyMessage="No spending data for this period"
              />
            )}

            {activeTab === "savings" && (
              <InsightList
                items={result.insights.savings}
                emptyMessage="No savings data for this period"
              />
            )}

            {activeTab === "budget" && (
              <InsightList
                items={result.insights.budget}
                emptyMessage="No budgets set for this month"
              />
            )}

            {activeTab === "goals" && (
              <InsightList
                items={result.insights.goals}
                emptyMessage="No active goals to analyze"
              />
            )}

            {activeTab === "billsAndEmi" && (
              <InsightList
                items={result.insights.billsAndEmi}
                emptyMessage="No bills or EMIs to analyze"
              />
            )}

            {activeTab === "netWorth" && (
              <InsightList
                items={result.insights.netWorth}
                emptyMessage="Add assets or liabilities to see net worth insights"
              />
            )}

            {activeTab === "predictions" && (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Predictions are estimates based on current trends, not
                    guarantees.
                  </p>
                </div>
                <InsightList
                  items={result.insights.predictions}
                  emptyMessage="Not enough data yet to generate predictions"
                />
              </>
            )}
          </div>
        </>
      )}

      {!result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-8 sm:p-12 text-center">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            No insights generated yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a period and click Generate AI Insights
          </p>
        </div>
      )}
    </div>
  );
}

export default AIInsights;
