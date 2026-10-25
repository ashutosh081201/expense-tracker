const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
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
      ],
      default: "Saving Account",
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

module.exports = mongoose.model("Saving", savingSchema);
