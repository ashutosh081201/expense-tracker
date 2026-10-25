const { GoogleGenerativeAI } = require("@google/generative-ai");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const EMI = require("../models/EMI");
const Bill = require("../models/Bill");
const { calculateNetWorth } = require("./netWorthController");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: get date range based on period type (same logic as reportController)
const getDateRange = (periodType, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (periodType) {
    case "this-month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "last-month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case "this-quarter": {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
      break;
    }
    case "this-year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "custom":
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  return { start, end };
};

// Helper: previous period of equal length, for comparison
const getPreviousPeriod = (start, end) => {
  const durationMs = end - start;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { prevStart, prevEnd };
};

// ─── BUILD STRUCTURED SUMMARY (no AI yet, pure calculation) ─
const buildSummary = async (userId, periodType, customStart, customEnd) => {
  const { start, end } = getDateRange(periodType, customStart, customEnd);
  const { prevStart, prevEnd } = getPreviousPeriod(start, end);

  const dateQuery = { userId, date: { $gte: start, $lte: end } };
  const prevDateQuery = { userId, date: { $gte: prevStart, $lte: prevEnd } };

  // ── Expenses ──
  const expenses = await Expense.find({ ...dateQuery, type: "expense" });
  const prevExpenses = await Expense.find({
    ...prevDateQuery,
    type: "expense",
  });

  const expenseCategoryTotals = {};
  expenses.forEach((e) => {
    expenseCategoryTotals[e.category] =
      (expenseCategoryTotals[e.category] || 0) + e.amount;
  });
  const prevExpenseCategoryTotals = {};
  prevExpenses.forEach((e) => {
    prevExpenseCategoryTotals[e.category] =
      (prevExpenseCategoryTotals[e.category] || 0) + e.amount;
  });

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const prevTotalExpense = prevExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Income ──
  const incomes = await Income.find(dateQuery);
  const prevIncomes = await Income.find(prevDateQuery);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const prevTotalIncome = prevIncomes.reduce((s, i) => s + i.amount, 0);

  // ── Savings ──
  const savings = await Saving.find(dateQuery);
  const prevSavings = await Saving.find(prevDateQuery);
  const totalSavings = savings.reduce((s, sv) => s + sv.amount, 0);
  const prevTotalSavings = prevSavings.reduce((s, sv) => s + sv.amount, 0);

  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const prevSavingsRate =
    prevTotalIncome > 0 ? (prevTotalSavings / prevTotalIncome) * 100 : 0;

  // ── Budget (current month only, matches app's live logic) ──
  const currentMonth = new Date().toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
  const budgets = await Budget.find({ userId, month: currentMonth });
  const allExpensesForBudget = await Expense.find({ userId, type: "expense" });
  const spendingByCategory = {};
  allExpensesForBudget.forEach((exp) => {
    const expMonth = new Date(exp.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    if (expMonth === currentMonth) {
      spendingByCategory[exp.category] =
        (spendingByCategory[exp.category] || 0) + exp.amount;
    }
  });
  const budgetSummary = budgets.map((b) => {
    const spent = spendingByCategory[b.category] || 0;
    const ratio = b.limit > 0 ? spent / b.limit : 0;
    return {
      category: b.category,
      limit: b.limit,
      spent,
      status: ratio >= 1 ? "exceeded" : ratio >= 0.8 ? "warning" : "safe",
    };
  });

  // ── Goals ──
  const goals = await Goal.find({ userId });
  const goalsSummary = goals.map((g) => {
    const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
    const daysLeft = Math.ceil(
      (new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return {
      title: g.title,
      progressPercent: pct,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      daysLeft,
      isCompleted: g.isCompleted,
    };
  });

  // ── EMI ──
  const emis = await EMI.find({ userId, isActive: true });
  const monthlyEMI = emis.reduce((s, e) => s + e.emiAmount, 0);
  const emiToIncomeRatio =
    totalIncome > 0 ? (monthlyEMI / totalIncome) * 100 : 0;
  const emiSummary = emis.map((e) => ({
    name: e.name,
    emiAmount: e.emiAmount,
    paidMonths: e.paidMonths,
    tenureMonths: e.tenureMonths,
    remainingMonths: e.tenureMonths - e.paidMonths,
  }));

  // ── Bills ──
  const bills = await Bill.find({ userId, isActive: true });
  const today = new Date();
  const todayDay = today.getDate();
  const billsSummary = bills.map((b) => {
    const isPaidThisMonth = b.lastPaidMonth === currentMonth;
    const daysUntilDue = b.dueDate - todayDay;
    let status = "upcoming";
    if (isPaidThisMonth) status = "paid";
    else if (daysUntilDue < 0) status = "overdue";
    else if (daysUntilDue <= 5) status = "due-soon";

    const recentHistory = (b.paymentHistory || []).slice(-3);
    const onTimeCount = recentHistory.filter((h) => h.onTime).length;

    return {
      name: b.name,
      amount: b.amount,
      status,
      recentPunctuality:
        recentHistory.length > 0
          ? `${onTimeCount}/${recentHistory.length} on time`
          : "no history",
    };
  });

  // ── Net Worth ──
  const netWorth = await calculateNetWorth(userId);

  // ── Financial Health Score (matches frontend logic) ──
  const savingsScore = Math.min(30, Math.round((savingsRate / 20) * 30));
  let budgetScore = 30;
  if (budgetSummary.length > 0) {
    const exceededCount = budgetSummary.filter(
      (b) => b.status === "exceeded",
    ).length;
    const warningCount = budgetSummary.filter(
      (b) => b.status === "warning",
    ).length;
    budgetScore = Math.max(0, 30 - exceededCount * 10 - warningCount * 4);
  }
  let emiScore;
  if (emiToIncomeRatio === 0) emiScore = 25;
  else if (emiToIncomeRatio <= 20) emiScore = 25;
  else if (emiToIncomeRatio <= 40) emiScore = 15;
  else emiScore = 5;
  const balance = totalIncome - totalExpense;
  const balanceScore = balance >= 0 ? 15 : 0;
  const healthScore = savingsScore + budgetScore + emiScore + balanceScore;

  return {
    period: {
      type: periodType,
      label: `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    },
    spending: {
      total: totalExpense,
      previousTotal: prevTotalExpense,
      categoryTotals: expenseCategoryTotals,
      previousCategoryTotals: prevExpenseCategoryTotals,
    },
    income: {
      total: totalIncome,
      previousTotal: prevTotalIncome,
    },
    savings: {
      total: totalSavings,
      previousTotal: prevTotalSavings,
      savingsRate: Math.round(savingsRate),
      previousSavingsRate: Math.round(prevSavingsRate),
    },
    budget: { entries: budgetSummary },
    goals: { entries: goalsSummary },
    emi: {
      entries: emiSummary,
      monthlyOutflow: monthlyEMI,
      emiToIncomeRatio: Math.round(emiToIncomeRatio),
    },
    bills: { entries: billsSummary },
    netWorth: {
      total: netWorth.netWorth,
      totalAssets: netWorth.totalAssets,
      totalLiabilities: netWorth.totalLiabilities,
    },
    healthScore: {
      total: healthScore,
      savingsScore,
      budgetScore,
      emiScore,
      balanceScore,
    },
  };
};

// Helper: sleep for retry backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── CALL GEMINI FOR INSIGHTS (with retry on 503) ──────────
const callGeminiWithRetry = async (model, prompt, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      lastError = err;
      const isRetryable =
        err.status === 503 ||
        err.message?.includes("503") ||
        err.message?.includes("overloaded");

      if (isRetryable && attempt < maxRetries) {
        console.log(
          `Gemini API busy (attempt ${attempt}/${maxRetries}), retrying in ${attempt * 2}s...`,
        );
        await sleep(attempt * 2000);
      } else {
        throw err;
      }
    }
  }

  throw lastError;
};

const generateAIInsights = async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;

    if (!periodType) {
      return res.status(400).json({ message: "periodType is required" });
    }
    if (periodType === "custom" && (!startDate || !endDate)) {
      return res
        .status(400)
        .json({ message: "startDate and endDate required for custom range" });
    }

    const summary = await buildSummary(
      req.user.id,
      periodType,
      startDate,
      endDate,
    );

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a financial insights assistant for a personal finance app called MoneyMap. Below is a structured JSON summary of a user's financial data for a specific period.

Generate insights STRICTLY based on the numbers given. Rules you MUST follow:
- Be descriptive and observational, NEVER prescriptive. Do not tell the user what to invest in, what to buy, or give financial/investment advice.
- Cite specific numbers from the data provided.
- Keep tone encouraging but honest — acknowledge both good and concerning patterns.
- For any predictions, clearly label them as estimates based on current trends, using phrases like "if this trend continues" — never state predictions as certainties.
- Do not mention categories/sections that have no data (empty arrays) — skip them entirely.
- Keep each insight to 1-2 sentences, concrete and specific.

Return ONLY valid JSON in this exact structure, with no markdown formatting, no code fences, just raw JSON:
{
  "spending": ["insight 1", "insight 2"],
  "budget": ["insight 1"],
  "savings": ["insight 1"],
  "goals": ["insight 1"],
  "billsAndEmi": ["insight 1"],
  "netWorth": ["insight 1"],
  "healthScore": ["insight 1"],
  "predictions": ["prediction 1"]
}

If a category has no meaningful data to comment on, return an empty array for it.

DATA:
${JSON.stringify(summary, null, 2)}`;

    // Retry logic handles transient Gemini 503 "busy" errors automatically
    const result = await callGeminiWithRetry(model, prompt, 3);
    const rawText = result.response.text();

    // Clean potential markdown code fences from response
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    let insights;
    try {
      insights = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", cleanedText);
      return res
        .status(500)
        .json({ message: "Failed to parse AI insights response" });
    }

    res.status(200).json({
      period: summary.period,
      summary: {
        healthScore: summary.healthScore.total,
        totalIncome: summary.income.total,
        totalExpense: summary.spending.total,
        totalSavings: summary.savings.total,
        netWorth: summary.netWorth.total,
      },
      insights,
    });
  } catch (err) {
    console.error("AI Insights error:", err);
    const isBusy =
      err.status === 503 ||
      err.message?.includes("503") ||
      err.message?.includes("overloaded");
    res.status(isBusy ? 503 : 500).json({
      message: isBusy
        ? "The AI service is currently busy handling requests. Please try again in a moment."
        : err.message || "Failed to generate AI insights",
    });
  }
};

module.exports = { generateAIInsights };
