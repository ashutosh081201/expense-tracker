const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
  {
    month: {
      type: String, // e.g. "Jul 2026"
      required: true,
    },
    dueDay: {
      type: Number,
      required: true,
    },
    paidOnDay: {
      type: Number,
      required: true,
    },
    onTime: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const billSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      // day of month e.g. 5 = every 5th of month
    },
    category: {
      type: String,
      enum: [
        "Electricity",
        "Water",
        "Internet",
        "Mobile",
        "OTT",
        "Insurance",
        "Rent",
        "Gas",
        "Credit Card",
        "Other",
      ],
      default: "Other",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPaidMonth: {
      type: String,
      default: "",
      // format: "Jul 2026"
    },
    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Bill", billSchema);
