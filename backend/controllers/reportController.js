const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const EMI = require("../models/EMI");
const Bill = require("../models/Bill");
const { calculateNetWorth } = require("./netWorthController");
const sendError = require("../utils/sendError");

// Helper: get date range based on period type
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

    case "last-quarter": {
      const q = Math.floor(now.getMonth() / 3) - 1;
      const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const qAdj = q < 0 ? 3 : q;
      start = new Date(year, qAdj * 3, 1);
      end = new Date(year, qAdj * 3 + 3, 0, 23, 59, 59);
      break;
    }

    case "this-year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;

    case "last-year":
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
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

// GENERATE PERIOD REPORT (Expenses / Income / Savings / All)
const generateReport = async (req, res) => {
  try {
    const { periodType, startDate, endDate, type } = req.query;

    if (!periodType) {
      return res.status(400).json({ message: "periodType is required" });
    }

    if (periodType === "custom" && (!startDate || !endDate)) {
      return res.status(400).json({
        message: "startDate and endDate are required for custom range",
      });
    }

    const { start, end } = getDateRange(periodType, startDate, endDate);

    const dateQuery = {
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    };

    let data = {};

    if (type === "expenses" || type === "all") {
      const expenses = await Expense.find({
        ...dateQuery,
        type: "expense",
      }).sort({ date: -1 });
      const categoryTotals = {};
      expenses.forEach((e) => {
        if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
        categoryTotals[e.category] += e.amount;
      });
      data.expenses = {
        entries: expenses,
        total: expenses.reduce((s, e) => s + e.amount, 0),
        categoryTotals,
        count: expenses.length,
      };
    }

    if (type === "income" || type === "all") {
      const incomes = await Income.find(dateQuery).sort({ date: -1 });
      const categoryTotals = {};
      incomes.forEach((i) => {
        if (!categoryTotals[i.category]) categoryTotals[i.category] = 0;
        categoryTotals[i.category] += i.amount;
      });
      data.income = {
        entries: incomes,
        total: incomes.reduce((s, i) => s + i.amount, 0),
        categoryTotals,
        count: incomes.length,
      };
    }

    if (type === "savings" || type === "all") {
      const savings = await Saving.find(dateQuery).sort({ date: -1 });
      const categoryTotals = {};
      savings.forEach((sv) => {
        if (!categoryTotals[sv.category]) categoryTotals[sv.category] = 0;
        categoryTotals[sv.category] += sv.amount;
      });
      data.savings = {
        entries: savings,
        total: savings.reduce((s, sv) => s + sv.amount, 0),
        categoryTotals,
        count: savings.length,
      };
    }

    res.status(200).json({
      period: {
        type: periodType,
        start: start.toISOString(),
        end: end.toISOString(),
        label: `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      },
      data,
    });
  } catch (err) {
    sendError(res, err);
  }
};

// GET CURRENT SNAPSHOT (Budget + Goals + EMI + Bills + NetWorth)
const getSnapshot = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    // ── Budget (exact same logic as budgetController.getBudgets) ──
    const budgets = await Budget.find({ userId, month: currentMonth });

    const allExpenses = await Expense.find({ userId, type: "expense" });

    const spending = {};
    allExpenses.forEach((exp) => {
      const expMonth = new Date(exp.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (expMonth === currentMonth) {
        spending[exp.category] = (spending[exp.category] || 0) + exp.amount;
      }
    });

    const budgetData = budgets.map((b) => {
      const spent = spending[b.category] || 0;
      const ratio = b.limit > 0 ? spent / b.limit : 0;
      return {
        category: b.category,
        limit: b.limit,
        spent,
        status: ratio >= 1 ? "exceeded" : ratio >= 0.8 ? "warning" : "safe",
      };
    });

    // Goals
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    const goalsData = goals.map((g) => ({
      title: g.title,
      category: g.category,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
      isCompleted: g.isCompleted,
    }));

    // EMI
    const emis = await EMI.find({ userId, isActive: true });
    const emiData = emis.map((e) => ({
      name: e.name,
      category: e.category,
      totalAmount: e.totalAmount,
      emiAmount: e.emiAmount,
      paidMonths: e.paidMonths,
      tenureMonths: e.tenureMonths,
      outstanding: (e.tenureMonths - e.paidMonths) * e.emiAmount,
    }));

    // Bills
    const bills = await Bill.find({ userId, isActive: true });
    const today = new Date();
    const todayDay = today.getDate();
    const billsData = bills.map((b) => {
      const isPaidThisMonth = b.lastPaidMonth === currentMonth;
      const daysUntilDue = b.dueDate - todayDay;
      let status = "upcoming";
      if (isPaidThisMonth) status = "paid";
      else if (daysUntilDue < 0) status = "overdue";
      else if (daysUntilDue === 0) status = "due-today";
      else if (daysUntilDue <= 5) status = "due-soon";

      return {
        name: b.name,
        category: b.category,
        amount: b.amount,
        dueDate: b.dueDate,
        status,
      };
    });

    // Net Worth
    const netWorthResult = await calculateNetWorth(userId);

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      month: currentMonth,
      budget: {
        entries: budgetData,
        totalLimit: budgetData.reduce((s, b) => s + b.limit, 0),
        totalSpent: budgetData.reduce((s, b) => s + b.spent, 0),
      },
      goals: {
        entries: goalsData,
        totalTarget: goalsData.reduce((s, g) => s + g.targetAmount, 0),
        totalSaved: goalsData.reduce((s, g) => s + g.currentAmount, 0),
        completedCount: goalsData.filter((g) => g.isCompleted).length,
      },
      emi: {
        entries: emiData,
        monthlyOutflow: emiData.reduce((s, e) => s + e.emiAmount, 0),
        totalOutstanding: emiData.reduce((s, e) => s + e.outstanding, 0),
      },
      bills: {
        entries: billsData,
        monthlyTotal: billsData.reduce((s, b) => s + b.amount, 0),
        paidCount: billsData.filter((b) => b.status === "paid").length,
        overdueCount: billsData.filter((b) => b.status === "overdue").length,
      },
      netWorth: netWorthResult,
    });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { generateReport, getSnapshot };
