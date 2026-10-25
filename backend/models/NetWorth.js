const mongoose = require("mongoose");

const netWorthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["asset", "liability"],
      required: true,
    },
    category: {
      type: String,
      default: "Other",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NetWorth", netWorthSchema);
