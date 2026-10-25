const Saving = require("../models/Saving");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const SAVING_EDITABLE_FIELDS = ["title", "amount", "category", "date", "notes"];

const getSavings = async (req, res) => {
  try {
    const savings = await Saving.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json(savings);
  } catch (err) {
    sendError(res, err);
  }
};

const addSaving = async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    const saving = await Saving.create({
      userId: req.user.id,
      title,
      amount,
      category,
      date,
      notes,
    });
    res.status(201).json(saving);
  } catch (err) {
    sendError(res, err);
  }
};

const editSaving = async (req, res) => {
  try {
    const saving = await Saving.findById(req.params.id);
    if (!saving) {
      return res.status(404).json({ message: "Saving not found" });
    }
    if (saving.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const updated = await Saving.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body, SAVING_EDITABLE_FIELDS),
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

const deleteSaving = async (req, res) => {
  try {
    const saving = await Saving.findById(req.params.id);
    if (!saving) {
      return res.status(404).json({ message: "Saving not found" });
    }
    if (saving.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    await Saving.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Saving deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

const getSavingStats = async (req, res) => {
  try {
    const savings = await Saving.find({ userId: req.user.id });

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
    savings.forEach((sav) => {
      const month = new Date(sav.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!months.includes(month)) return;

      if (categoryStats[sav.category]) {
        categoryStats[sav.category] += sav.amount;
      } else {
        categoryStats[sav.category] = sav.amount;
      }
    });

    const monthlyStats = {};
    months.forEach((m) => {
      monthlyStats[m] = 0;
    });

    savings.forEach((sav) => {
      const month = new Date(sav.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (months.includes(month)) {
        monthlyStats[month] += sav.amount;
      }
    });

    const savingCategories = [
      "Saving Account",
      "Current Account",
      "Fixed Deposit",
      "Stocks",
      "Mutual Funds",
      "Gold",
      "Real Estate",
      "Crypto",
      "PPF",
      "Other",
    ];

    const categoryMonthData = {};
    savingCategories.forEach((cat) => {
      categoryMonthData[cat] = {};
      months.forEach((m) => {
        categoryMonthData[cat][m] = 0;
      });
    });

    savings.forEach((sav) => {
      const month = new Date(sav.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (categoryMonthData[sav.category] && months.includes(month)) {
        categoryMonthData[sav.category][month] += sav.amount;
      }
    });

    const filteredCategoryMonth = {};
    savingCategories.forEach((cat) => {
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
const bulkDeleteSavings = async (req, res) => {
  try {
    const { ids } = req.body;
    await Saving.deleteMany({
      _id: { $in: ids },
      userId: req.user.id,
    });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getSavings,
  addSaving,
  editSaving,
  deleteSaving,
  getSavingStats,
  bulkDeleteSavings,
};
