const Income = require("../models/Income");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const INCOME_EDITABLE_FIELDS = ["title", "amount", "category", "date", "notes"];

const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json(incomes);
  } catch (err) {
    sendError(res, err);
  }
};

const addIncome = async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    const income = await Income.create({
      userId: req.user.id,
      title,
      amount,
      category,
      date,
      notes,
    });
    res.status(201).json(income);
  } catch (err) {
    sendError(res, err);
  }
};

const editIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    if (income.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const updated = await Income.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body, INCOME_EDITABLE_FIELDS),
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

const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    if (income.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    await Income.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Income deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

const getIncomeStats = async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user.id });

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
    incomes.forEach((inc) => {
      const month = new Date(inc.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!months.includes(month)) return;

      if (categoryStats[inc.category]) {
        categoryStats[inc.category] += inc.amount;
      } else {
        categoryStats[inc.category] = inc.amount;
      }
    });

    const monthlyStats = {};
    months.forEach((m) => {
      monthlyStats[m] = 0;
    });

    incomes.forEach((inc) => {
      const month = new Date(inc.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (months.includes(month)) {
        monthlyStats[month] += inc.amount;
      }
    });

    const incomeCategories = [
      "Salary",
      "House Rent",
      "Freelance",
      "Bank Interest",
      "Capital Gains",
      "Mutual Funds",
      "Dividends",
      "Business",
      "Bonus",
      "Other",
    ];

    const categoryMonthData = {};
    incomeCategories.forEach((cat) => {
      categoryMonthData[cat] = {};
      months.forEach((m) => {
        categoryMonthData[cat][m] = 0;
      });
    });

    incomes.forEach((inc) => {
      const month = new Date(inc.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (categoryMonthData[inc.category] && months.includes(month)) {
        categoryMonthData[inc.category][month] += inc.amount;
      }
    });

    const filteredCategoryMonth = {};
    incomeCategories.forEach((cat) => {
      const hasData = months.some((m) => categoryMonthData[cat][m] > 0);
      if (hasData) filteredCategoryMonth[cat] = categoryMonthData[cat];
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
      months,
      categoryMonthData: filteredCategoryMonth,
    });
  } catch (err) {
    sendError(res, err);
  }
};
const bulkDeleteIncomes = async (req, res) => {
  try {
    const { ids } = req.body;
    await Income.deleteMany({
      _id: { $in: ids },
      userId: req.user.id,
    });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getIncomes,
  addIncome,
  editIncome,
  deleteIncome,
  getIncomeStats,
  bulkDeleteIncomes,
};
