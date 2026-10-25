const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema(
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
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    emiAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    paidMonths: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Home Loan",
        "Car Loan",
        "Personal Loan",
        "Education Loan",
        "Credit Card",
        "Other",
      ],
      default: "Other",
    },
    notes: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EMI", emiSchema);
