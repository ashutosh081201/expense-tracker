const mongoose = require("mongoose");

const netWorthHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String, // e.g. "Jul 2026"
      required: true,
    },
    netWorth: {
      type: Number,
      required: true,
    },
    totalAssets: {
      type: Number,
      required: true,
    },
    totalLiabilities: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

// One snapshot per user per month
netWorthHistorySchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("NetWorthHistory", netWorthHistorySchema);
