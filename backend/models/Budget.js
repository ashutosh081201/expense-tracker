const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    limit: {
      type: Number,
      required: true,
      min: 1,
    },
    month: {
      type: String,
      required: true,
      // format: "Jul 2026"
    },
  },
  { timestamps: true },
);

// One budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
