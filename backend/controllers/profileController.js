const User = require("../models/User");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");
const sendError = require("../utils/sendError");

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get counts
    const [expenseCount, incomeCount, savingCount] = await Promise.all([
      Expense.countDocuments({ userId: req.user.id }),
      Income.countDocuments({ userId: req.user.id }),
      Saving.countDocuments({ userId: req.user.id }),
    ]);

    res.status(200).json({
      user,
      stats: {
        expenses: expenseCount,
        incomes: incomeCount,
        savings: savingCount,
        total: expenseCount + incomeCount + savingCount,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name, avatarColor } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatarColor },
      { returnDocument: "after" },
    ).select("-password");

    res.status(200).json({ user });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { getProfile, updateProfile };
