const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const sendError = require("../utils/sendError");

// GET ALL BUDGETS FOR CURRENT MONTH
const getBudgets = async (req, res) => {
  try {
    const month =
      req.query.month ||
      new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

    const budgets = await Budget.find({
      userId: req.user.id,
      month,
    });

    // Get actual spending per category this month
    const expenses = await Expense.find({
      userId: req.user.id,
      type: "expense",
    });

    const spending = {};
    expenses.forEach((exp) => {
      const expMonth = new Date(exp.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (expMonth === month) {
        spending[exp.category] = (spending[exp.category] || 0) + exp.amount;
      }
    });

    // Combine budgets with spending
    const result = budgets.map((budget) => ({
      _id: budget._id,
      category: budget.category,
      limit: budget.limit,
      month: budget.month,
      spent: spending[budget.category] || 0,
      percent: Math.round(
        ((spending[budget.category] || 0) / budget.limit) * 100,
      ),
      status:
        (spending[budget.category] || 0) / budget.limit >= 1
          ? "exceeded"
          : (spending[budget.category] || 0) / budget.limit >= 0.8
            ? "warning"
            : "safe",
    }));

    res.status(200).json({ budgets: result, month });
  } catch (err) {
    sendError(res, err);
  }
};

// SET / UPDATE BUDGET
const setBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user.id, category, month },
      { limit },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json(budget);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE BUDGET
const deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ message: "Budget deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { getBudgets, setBudget, deleteBudget };
