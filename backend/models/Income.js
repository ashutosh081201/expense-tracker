const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [
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
      ],
      default: "Salary",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Income", incomeSchema);
