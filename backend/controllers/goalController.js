const Goal = require("../models/Goal");
const Saving = require("../models/Saving");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const GOAL_EDITABLE_FIELDS = [
  "title",
  "targetAmount",
  "deadline",
  "category",
  "notes",
];

// GET ALL GOALS
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(goals);
  } catch (err) {
    sendError(res, err);
  }
};

// ADD GOAL
const addGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline, category, notes } = req.body;
    const goal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount,
      deadline,
      category,
      notes,
    });
    res.status(201).json(goal);
  } catch (err) {
    sendError(res, err);
  }
};

// ADD MONEY TO GOAL
// Also creates a matching Saving entry so this contribution
// reflects in Savings / Net Worth / Dashboard totals
const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const addedAmount = parseFloat(amount);
    if (!Number.isFinite(addedAmount) || addedAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    goal.currentAmount += addedAmount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.isCompleted = true;
    }

    await goal.save();

    // Auto-create matching Saving entry
    const saving = await Saving.create({
      userId: req.user.id,
      title: `Goal: ${goal.title}`,
      amount: addedAmount,
      category: "Other",
      date: new Date().toISOString().split("T")[0],
      notes: "Auto-added from Goal contribution",
    });

    res.status(200).json({ goal, saving });
  } catch (err) {
    sendError(res, err);
  }
};

// GET LINKED SAVINGS — used to warn user before deleting
// a Goal that has auto-created saving entries tied to it.
// Matches by title pattern ("Goal: {Goal Title}") + the
// specific notes tag used by addMoney(), so only genuinely
// linked entries are counted (not unrelated savings with
// a similar title).
const getLinkedSavings = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const linked = await Saving.find({
      userId: req.user.id,
      title: `Goal: ${goal.title}`,
      notes: "Auto-added from Goal contribution",
    });

    res.status(200).json({
      count: linked.length,
      total: linked.reduce((s, e) => s + e.amount, 0),
    });
  } catch (err) {
    sendError(res, err);
  }
};

// EDIT GOAL
const editGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      pickFields(req.body, GOAL_EDITABLE_FIELDS),
      { returnDocument: "after", runValidators: true },
    );
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.status(200).json(goal);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE GOAL
const deleteGoal = async (req, res) => {
  try {
    await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ message: "Goal deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getGoals,
  addGoal,
  addMoney,
  getLinkedSavings,
  editGoal,
  deleteGoal,
};
