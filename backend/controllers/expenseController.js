const Expense = require("../models/Expense");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const EXPENSE_EDITABLE_FIELDS = [
  "title",
  "amount",
  "type",
  "category",
  "date",
  "notes",
];

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json(expenses);
  } catch (err) {
    sendError(res, err);
  }
};

const addExpense = async (req, res) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;
    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount,
      type,
      category,
      date,
      notes,
    });
    res.status(201).json(expense);
  } catch (err) {
    sendError(res, err);
  }
};

const editExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body, EXPENSE_EDITABLE_FIELDS),
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    res.status(200).json(updated);
  } catch (err) {
    sendError(res, err);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Expense deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

const getStats = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });

    // Last 6 months window
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

    // categoryStats — now scoped to last 6 months only
    // (previously summed ALL-TIME entries)
    const categoryStats = {};
    expenses
      .filter((e) => e.type === "expense")
      .forEach((exp) => {
        const month = new Date(exp.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!months.includes(month)) return;

        if (categoryStats[exp.category]) {
          categoryStats[exp.category] += exp.amount;
        } else {
          categoryStats[exp.category] = exp.amount;
        }
      });

    const monthlyStats = {};
    const monthlyIncome = {};
    const monthlyExpense = {};

    months.forEach((m) => {
      monthlyStats[m] = 0;
      monthlyIncome[m] = 0;
      monthlyExpense[m] = 0;
    });

    expenses.forEach((exp) => {
      const month = new Date(exp.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!months.includes(month)) return;
      if (exp.type === "expense") {
        monthlyStats[month] += exp.amount;
        monthlyExpense[month] += exp.amount;
      } else {
        monthlyIncome[month] += exp.amount;
      }
    });

    const total = Object.values(categoryStats).reduce((s, v) => s + v, 0);
    const categoryPercent = {};
    Object.entries(categoryStats).forEach(([cat, amt]) => {
      categoryPercent[cat] =
        total > 0 ? ((amt / total) * 100).toFixed(1) : "0.0";
    });

    res.status(200).json({
      categoryStats,
      categoryPercent,
      monthlyStats,
      monthlyIncome,
      monthlyExpense,
      months,
    });
  } catch (err) {
    sendError(res, err);
  }
};

const getCategoryMonthStats = async (req, res) => {
  try {
    const expenses = await Expense.find({
      userId: req.user.id,
      type: "expense",
    });

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

    const categories = [
      "Food",
      "Travel",
      "Shopping",
      "Bills",
      "Entertainment",
      "Health",
      "Education",
      "Groceries",
      "Fuel",
      "Other",
    ];

    const data = {};
    categories.forEach((cat) => {
      data[cat] = {};
      months.forEach((m) => {
        data[cat][m] = 0;
      });
    });

    expenses.forEach((exp) => {
      const month = new Date(exp.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (data[exp.category] && months.includes(month)) {
        data[exp.category][month] += exp.amount;
      }
    });

    const filtered = {};
    categories.forEach((cat) => {
      const hasData = months.some((m) => data[cat][m] > 0);
      if (hasData) filtered[cat] = data[cat];
    });

    res.status(200).json({ months, categoryMonthData: filtered });
  } catch (err) {
    sendError(res, err);
  }
};

// BULK DELETE EXPENSES
const bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body;
    await Expense.deleteMany({
      _id: { $in: ids },
      userId: req.user.id,
    });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getExpenses,
  addExpense,
  editExpense,
  deleteExpense,
  getStats,
  getCategoryMonthStats,
  bulkDeleteExpenses,
};
