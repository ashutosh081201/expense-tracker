const NetWorth = require("../models/NetWorth");
const NetWorthHistory = require("../models/NetWorthHistory");
const Saving = require("../models/Saving");
const EMI = require("../models/EMI");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const NETWORTH_EDITABLE_FIELDS = ["name", "value", "type", "category"];

// SHARED — Calculate net worth for a user (used by API + cron)
const calculateNetWorth = async (userId) => {
  const entries = await NetWorth.find({ userId }).sort({ createdAt: -1 });

  const savings = await Saving.find({ userId });
  const totalSavings = savings.reduce((s, e) => s + e.amount, 0);

  const emis = await EMI.find({ userId, isActive: true });
  const totalEMIOutstanding = emis.reduce(
    (s, e) => s + (e.tenureMonths - e.paidMonths) * e.emiAmount,
    0,
  );

  const manualAssets = entries.filter((e) => e.type === "asset");
  const manualLiabilities = entries.filter((e) => e.type === "liability");

  const totalManualAssets = manualAssets.reduce((s, e) => s + e.value, 0);
  const totalManualLiabilities = manualLiabilities.reduce(
    (s, e) => s + e.value,
    0,
  );

  const totalAssets = totalSavings + totalManualAssets;
  const totalLiabilities = totalEMIOutstanding + totalManualLiabilities;
  const netWorth = totalAssets - totalLiabilities;

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    breakdown: {
      autoAssets: [
        {
          _id: "savings",
          name: "Total Savings",
          value: totalSavings,
          category: "Savings",
          type: "asset",
          auto: true,
        },
      ],
      autoLiabilities:
        totalEMIOutstanding > 0
          ? [
              {
                _id: "emi",
                name: "EMI Outstanding",
                value: totalEMIOutstanding,
                category: "Loans",
                type: "liability",
                auto: true,
              },
            ]
          : [],
      manualAssets,
      manualLiabilities,
    },
  };
};

// GET NET WORTH SUMMARY
const getNetWorth = async (req, res) => {
  try {
    const result = await calculateNetWorth(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err);
  }
};

// GET NET WORTH HISTORY (for trend chart)
const getNetWorthHistory = async (req, res) => {
  try {
    const history = await NetWorthHistory.find({ userId: req.user.id });

    // Sort by the actual "month" field (parsed as a real
    // date), not by createdAt — this ensures correct
    // chronological order regardless of insertion order
    const sorted = history.sort(
      (a, b) => new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`),
    );

    res.status(200).json(sorted);
  } catch (err) {
    sendError(res, err);
  }
};

// ADD ENTRY
const addEntry = async (req, res) => {
  try {
    const { name, value, type, category } = req.body;
    const entry = await NetWorth.create({
      userId: req.user.id,
      name,
      value,
      type,
      category,
    });
    res.status(201).json(entry);
  } catch (err) {
    sendError(res, err);
  }
};

// EDIT ENTRY
const editEntry = async (req, res) => {
  try {
    const entry = await NetWorth.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      pickFields(req.body, NETWORTH_EDITABLE_FIELDS),
      { returnDocument: "after", runValidators: true },
    );
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.status(200).json(entry);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE ENTRY
const deleteEntry = async (req, res) => {
  try {
    await NetWorth.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ message: "Entry deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

// SNAPSHOT — called by monthly cron for ALL users
// Fires at 6 AM on the 1st of a new month, so "now" is
// already the new month. We snapshot the PREVIOUS month's
// label instead, so the permanent record correctly captures
// that month's closing net worth — otherwise the current
// month's data would perpetually disappear the moment it
// rolls over, since the live-append logic in the frontend
// only shows the CURRENT month, never a past one.
const snapshotAllUsersNetWorth = async () => {
  const User = require("../models/User");
  const users = await User.find({}, "_id");

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const snapshotMonth = lastMonth.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  let created = 0;
  for (const user of users) {
    try {
      const { netWorth, totalAssets, totalLiabilities } =
        await calculateNetWorth(user._id);

      await NetWorthHistory.findOneAndUpdate(
        { userId: user._id, month: snapshotMonth },
        { netWorth, totalAssets, totalLiabilities },
        { upsert: true, returnDocument: "after" },
      );
      created++;
    } catch (err) {
      console.error(`Snapshot failed for user ${user._id}:`, err.message);
    }
  }

  console.log(
    `Net worth snapshot done for ${created} users (${snapshotMonth})`,
  );
  return created;
};

module.exports = {
  getNetWorth,
  getNetWorthHistory,
  addEntry,
  editEntry,
  deleteEntry,
  calculateNetWorth,
  snapshotAllUsersNetWorth,
};
