import { useState, useEffect } from "react";
import api from "../api/axios";
import Charts from "../components/Charts";
import {
  BudgetVsActualChart,
  MonthlyCashFlowChart,
  GoalsProgressChart,
  EMIBurdenChart,
  NetWorthDashboardChart,
  SavingsRateChart,
  IncomeExpenseBalanceChart,
  EMIIncomeRatioCard,
  SavingsTrendChart,
  TopSpendingCategoriesCard,
  FinancialHealthScoreCard,
  NetWorthGrowthChart,
  EMILineComparisonChart,
  EMICategoryComparisonChart,
  BillsStatusDonutCompact,
  BillsCategoryPieChart,
  BillsMonthlyTrendChart,
  BillsCategoryMonthChart,
  PaymentPunctualityCard,
  AssetsCategoryPieChart,
  LiabilitiesCategoryPieChart,
  NetWorthDivergingChart,
  NetWorthProgressBarCard,
  BudgetStatusDonutChart,
  CategorySpendingSharePieChart,
  GoalsContributionPieChart,
  GoalsTimelineChart,
} from "../components/DashboardCharts";
import DueCalendar from "../components/DueCalendar";
import EmptyState from "../components/EmptyState";
import { DashboardSkeleton } from "../components/SkeletonLoader";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expenseStats, setExpenseStats] = useState(null);
  const [expCatMonth, setExpCatMonth] = useState(null);
  const [incomeStats, setIncomeStats] = useState(null);
  const [savingStats, setSavingStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savings, setSavings] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [emis, setEmis] = useState([]);
  const [bills, setBills] = useState([]);
  const [netWorthData, setNetWorthData] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const currentMonth = new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const [
        expStatsRes,
        expRes,
        expCatMonthRes,
        incStatsRes,
        incRes,
        savStatsRes,
        savRes,
        budgetRes,
        goalsRes,
        emisRes,
        billsRes,
        netWorthRes,
        netWorthHistoryRes,
      ] = await Promise.all([
        api.get("/expenses/stats"),
        api.get("/expenses"),
        api.get("/expenses/category-month"),
        api.get("/income/stats"),
        api.get("/income"),
        api.get("/saving/stats"),
        api.get("/saving"),
        api.get(`/budget?month=${currentMonth}`),
        api.get("/goals"),
        api.get("/emi"),
        api.get("/bills"),
        api.get("/networth"),
        api.get("/networth/history"),
      ]);

      setExpenseStats(expStatsRes.data);
      setExpCatMonth(expCatMonthRes.data.categoryMonthData);
      setExpenses(expRes.data);
      setIncomeStats(incStatsRes.data);
      setIncomes(incRes.data);
      setSavingStats(savStatsRes.data);
      setSavings(savRes.data);
      setBudgets(budgetRes.data.budgets || []);
      setGoals(goalsRes.data);
      setEmis(emisRes.data);
      setBills(billsRes.data);
      setNetWorthData(netWorthRes.data);
      setNetWorthHistory(netWorthHistoryRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalSavings = savings.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const getActiveData = () => {
    if (activeTab === "expenses") {
      return {
        categoryStats: expenseStats?.categoryStats || {},
        monthlyStats: expenseStats?.monthlyStats || {},
        categoryMonthData: expCatMonth || {},
        months: expenseStats?.months || [],
        currentMonthTotal: getMonthTotal(
          expenses.filter((e) => e.type === "expense"),
          currentMonth,
        ),
        lastMonthTotal: getMonthTotal(
          expenses.filter((e) => e.type === "expense"),
          lastMonth,
        ),
      };
    }
    if (activeTab === "income") {
      return {
        categoryStats: incomeStats?.categoryStats || {},
        monthlyStats: incomeStats?.monthlyStats || {},
        categoryMonthData: incomeStats?.categoryMonthData || {},
        months: incomeStats?.months || [],
        currentMonthTotal: getMonthTotal(incomes, currentMonth),
        lastMonthTotal: getMonthTotal(incomes, lastMonth),
      };
    }
    if (activeTab === "savings") {
      return {
        categoryStats: savingStats?.categoryStats || {},
        monthlyStats: savingStats?.monthlyStats || {},
        categoryMonthData: savingStats?.categoryMonthData || {},
        months: savingStats?.months || [],
        currentMonthTotal: getMonthTotal(savings, currentMonth),
        lastMonthTotal: getMonthTotal(savings, lastMonth),
      };
    }
    return null;
  };

  const activeData = getActiveData();

  const pctChange =
    activeData && activeData.lastMonthTotal === 0
      ? null
      : activeData
        ? (
            ((activeData.currentMonthTotal - activeData.lastMonthTotal) /
              activeData.lastMonthTotal) *
            100
          ).toFixed(1)
        : null;

  const hasNoData =
    expenses.length === 0 && incomes.length === 0 && savings.length === 0;

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "expenses", label: "💸 Expenses" },
    { key: "income", label: "💼 Income" },
    { key: "savings", label: "💰 Savings" },
    { key: "budget", label: "💳 Budget" },
    { key: "goals", label: "🎯 Goals" },
    { key: "emi", label: "🏦 EMI" },
    { key: "bills", label: "🔔 Bills" },
    { key: "networth", label: "📈 Net Worth" },
  ];

  const getTabActiveClass = (key) => {
    const colorMap = {
      overview: "bg-indigo-600  text-white border-indigo-600",
      expenses: "bg-red-600     text-white border-red-600",
      income: "bg-green-600   text-white border-green-600",
      savings: "bg-purple-600  text-white border-purple-600",
      budget: "bg-blue-600    text-white border-blue-600",
      goals: "bg-blue-600    text-white border-blue-600",
      emi: "bg-blue-600    text-white border-blue-600",
      bills: "bg-blue-600    text-white border-blue-600",
      networth: "bg-blue-600    text-white border-blue-600",
    };
    return colorMap[key] || "bg-blue-600 text-white border-blue-600";
  };

  const renderMonthCards = (isPositiveGood = false) => {
    if (!activeData) return null;
    const isUp = pctChange !== null && parseFloat(pctChange) > 0;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border-l-4 border-blue-400 dark:border-blue-500">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            This Month ({currentMonth})
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
            ₹{activeData.currentMonthTotal.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border-l-4 border-gray-300 dark:border-gray-600">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Last Month ({lastMonth})
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
            ₹{activeData.lastMonthTotal.toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-lg p-3 sm:p-4 shadow border-l-4 ${
            pctChange === null
              ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              : isUp
                ? isPositiveGood
                  ? "bg-green-50 dark:bg-green-900/20 border-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border-red-400"
                : isPositiveGood
                  ? "bg-red-50 dark:bg-red-900/20 border-red-400"
                  : "bg-green-50 dark:bg-green-900/20 border-green-400"
          }`}
        >
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            vs Last Month
          </p>
          {pctChange === null ? (
            <p className="text-sm sm:text-lg font-bold text-gray-400 dark:text-gray-500">
              No data last month
            </p>
          ) : (
            <p
              className={`text-lg sm:text-2xl font-bold ${
                isUp
                  ? isPositiveGood
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                  : isPositiveGood
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
              }`}
            >
              {isUp ? "↑" : "↓"}
              {Math.abs(pctChange)}%
              <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 ml-1 sm:ml-2 block sm:inline">
                {isUp ? "more" : "less"} than last month
              </span>
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        Dashboard
      </h1>

      {/* Row 1 — Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-green-800">
          <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
            Total Income
          </p>
          <p className="text-base sm:text-xl font-bold text-green-700 dark:text-green-400 mt-1">
            ₹{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-red-800">
          <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
            Total Expenses
          </p>
          <p className="text-base sm:text-xl font-bold text-red-700 dark:text-red-400 mt-1">
            ₹{totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-purple-800">
          <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
            Total Savings
          </p>
          <p className="text-base sm:text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">
            ₹{totalSavings.toLocaleString()}
          </p>
        </div>
        <div
          className={`${
            balance >= 0
              ? "bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800"
              : "bg-orange-100 dark:bg-orange-900/30 dark:border-orange-800"
          } rounded-lg p-3 sm:p-4 shadow border border-transparent`}
        >
          <p
            className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide ${
              balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            Balance
          </p>
          <p
            className={`text-base sm:text-xl font-bold mt-1 ${
              balance >= 0
                ? "text-blue-700 dark:text-blue-400"
                : "text-orange-700 dark:text-orange-400"
            }`}
          >
            {balance >= 0 ? "" : "-"}₹{Math.abs(balance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Row 2 — Tabs */}
      {hasNoData ? (
        <EmptyState
          icon="📊"
          title="No data yet"
          message="Start by adding expenses, income or savings to see your analytics"
        />
      ) : (
        <>
          <div className="mb-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Analytics
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto sm:overflow-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition border whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? getTabActiveClass(tab.key)
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              <FinancialHealthScoreCard
                incomes={incomes}
                expenses={expenses}
                savings={savings}
                budgets={budgets}
                emis={emis}
              />

              <MonthlyCashFlowChart
                expenses={expenses}
                incomes={incomes}
                savings={savings}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <SavingsRateChart incomes={incomes} savings={savings} />
                <IncomeExpenseBalanceChart
                  expenses={expenses}
                  incomes={incomes}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <SavingsTrendChart savings={savings} />
                <TopSpendingCategoriesCard expenses={expenses} />
              </div>

              {emis.filter((e) => e.isActive).length > 0 && (
                <EMIIncomeRatioCard emis={emis} incomes={incomes} />
              )}
            </div>
          )}

          {/* ── Expenses Tab ── */}
          {activeTab === "expenses" && (
            <>
              {renderMonthCards(false)}
              {activeData?.months?.length > 0 &&
              Object.keys(activeData.categoryStats).length > 0 ? (
                <Charts
                  categoryStats={activeData.categoryStats}
                  monthlyStats={activeData.monthlyStats}
                  categoryMonthData={activeData.categoryMonthData}
                  months={activeData.months}
                  activeTab={activeTab}
                />
              ) : (
                <EmptyState
                  icon="💸"
                  title="No expense data yet"
                  message="Add some expenses to see analytics here"
                />
              )}
            </>
          )}

          {/* ── Income Tab ── */}
          {activeTab === "income" && (
            <>
              {renderMonthCards(true)}
              {activeData?.months?.length > 0 &&
              Object.keys(activeData.categoryStats).length > 0 ? (
                <Charts
                  categoryStats={activeData.categoryStats}
                  monthlyStats={activeData.monthlyStats}
                  categoryMonthData={activeData.categoryMonthData}
                  months={activeData.months}
                  activeTab={activeTab}
                />
              ) : (
                <EmptyState
                  icon="💼"
                  title="No income data yet"
                  message="Add some income to see analytics here"
                />
              )}
            </>
          )}

          {/* ── Savings Tab ── */}
          {activeTab === "savings" && (
            <>
              {renderMonthCards(true)}
              {activeData?.months?.length > 0 &&
              Object.keys(activeData.categoryStats).length > 0 ? (
                <Charts
                  categoryStats={activeData.categoryStats}
                  monthlyStats={activeData.monthlyStats}
                  categoryMonthData={activeData.categoryMonthData}
                  months={activeData.months}
                  activeTab={activeTab}
                />
              ) : (
                <EmptyState
                  icon="💰"
                  title="No savings data yet"
                  message="Add some savings to see analytics here"
                />
              )}
            </>
          )}

          {/* ── Budget Tab ── */}
          {activeTab === "budget" && (
            <>
              {budgets.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Budget
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        ₹
                        {budgets
                          .reduce((s, b) => s + b.limit, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Spent
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                        ₹
                        {budgets
                          .reduce((s, b) => s + b.spent, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Alerts
                      </p>
                      <p className="text-base sm:text-2xl font-bold">
                        {budgets.filter((b) => b.status === "exceeded").length >
                        0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            {
                              budgets.filter((b) => b.status === "exceeded")
                                .length
                            }{" "}
                            🔴
                          </span>
                        ) : budgets.filter((b) => b.status === "warning")
                            .length > 0 ? (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            {
                              budgets.filter((b) => b.status === "warning")
                                .length
                            }{" "}
                            🟡
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            All good ✅
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <BudgetVsActualChart budgets={budgets} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <BudgetStatusDonutChart budgets={budgets} />
                    <CategorySpendingSharePieChart budgets={budgets} />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="💳"
                  title="No budgets set"
                  message="Go to Budget page to set monthly budgets per category"
                />
              )}
            </>
          )}

          {/* ── Goals Tab ── */}
          {activeTab === "goals" && (
            <>
              {goals.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Goals
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {goals.length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Completed
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {goals.filter((g) => g.isCompleted).length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Saved
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ₹
                        {goals
                          .reduce((s, g) => s + g.currentAmount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <GoalsProgressChart goals={goals} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <GoalsContributionPieChart goals={goals} />
                    <GoalsTimelineChart goals={goals} />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="🎯"
                  title="No goals yet"
                  message="Go to Goals page to set your financial goals"
                />
              )}
            </>
          )}

          {/* ── EMI Tab ── */}
          {activeTab === "emi" && (
            <>
              {emis.filter((e) => e.isActive).length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Active EMIs
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {emis.filter((e) => e.isActive).length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Monthly Outflow
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                        ₹
                        {emis
                          .filter((e) => e.isActive)
                          .reduce((s, e) => s + e.emiAmount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Outstanding
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                        ₹
                        {emis
                          .filter((e) => e.isActive)
                          .reduce(
                            (s, e) =>
                              s + (e.tenureMonths - e.paidMonths) * e.emiAmount,
                            0,
                          )
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <EMIIncomeRatioCard emis={emis} incomes={incomes} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <EMIBurdenChart emis={emis} />
                    <EMILineComparisonChart emis={emis} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <EMICategoryComparisonChart emis={emis} />
                    <DueCalendar emis={emis} bills={[]} mode="emi" />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="🏦"
                  title="No active EMIs"
                  message="Go to EMI page to add your loan EMIs"
                />
              )}
            </>
          )}

          {/* ── Bills Tab ── */}
          {activeTab === "bills" && (
            <>
              {bills.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Bills
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        {bills.length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Paid
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {bills.filter((b) => b.status === "paid").length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Overdue
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                        {bills.filter((b) => b.status === "overdue").length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Monthly Total
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹
                        {bills
                          .reduce((s, b) => s + b.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <BillsCategoryPieChart bills={bills} />
                    <PaymentPunctualityCard bills={bills} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <BillsMonthlyTrendChart bills={bills} />
                    <BillsCategoryMonthChart bills={bills} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <BillsStatusDonutCompact bills={bills} />
                    <DueCalendar emis={[]} bills={bills} mode="bills" />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="🔔"
                  title="No bill reminders"
                  message="Go to Bills page to add your recurring bills"
                />
              )}
            </>
          )}

          {/* ── Net Worth Tab ── */}
          {activeTab === "networth" && (
            <>
              {netWorthData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Assets
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{(netWorthData.totalAssets || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {
                          [
                            ...(netWorthData.breakdown?.autoAssets || []),
                            ...(netWorthData.breakdown?.manualAssets || []),
                          ].length
                        }{" "}
                        entries
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-transparent dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Total Liabilities
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                        ₹{(netWorthData.totalLiabilities || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {
                          [
                            ...(netWorthData.breakdown?.autoLiabilities || []),
                            ...(netWorthData.breakdown?.manualLiabilities ||
                              []),
                          ].length
                        }{" "}
                        entries
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 sm:p-4 shadow border border-transparent ${
                        (netWorthData.netWorth || 0) >= 0
                          ? "bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
                          : "bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800"
                      }`}
                    >
                      <p
                        className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 ${
                          (netWorthData.netWorth || 0) >= 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        Net Worth
                      </p>
                      <p
                        className={`text-lg sm:text-2xl font-bold ${
                          (netWorthData.netWorth || 0) >= 0
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-orange-700 dark:text-orange-400"
                        }`}
                      >
                        {(netWorthData.netWorth || 0) >= 0 ? "" : "-"}₹
                        {Math.abs(netWorthData.netWorth || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <AssetsCategoryPieChart netWorthData={netWorthData} />
                    <LiabilitiesCategoryPieChart netWorthData={netWorthData} />
                  </div>

                  <div className="mb-6">
                    <NetWorthGrowthChart
                      history={netWorthHistory}
                      currentSnapshot={netWorthData}
                    />
                  </div>

                  <div className="mb-6">
                    <NetWorthDashboardChart netWorthData={netWorthData} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <NetWorthProgressBarCard netWorthData={netWorthData} />
                    <NetWorthDivergingChart netWorthData={netWorthData} />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="📈"
                  title="No net worth data"
                  message="Go to Net Worth page to add your assets and liabilities"
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
