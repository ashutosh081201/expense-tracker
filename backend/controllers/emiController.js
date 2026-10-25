const EMI = require("../models/EMI");
const Expense = require("../models/Expense");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const EMI_EDITABLE_FIELDS = [
  "name",
  "totalAmount",
  "emiAmount",
  "interestRate",
  "tenureMonths",
  "startDate",
  "category",
  "notes",
];

// GET ALL EMIs
const getEMIs = async (req, res) => {
  try {
    const emis = await EMI.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(emis);
  } catch (err) {
    sendError(res, err);
  }
};

// ADD EMI
const addEMI = async (req, res) => {
  try {
    const {
      name,
      totalAmount,
      emiAmount,
      interestRate,
      tenureMonths,
      startDate,
      category,
      notes,
    } = req.body;

    const emi = await EMI.create({
      userId: req.user.id,
      name,
      totalAmount,
      emiAmount,
      interestRate,
      tenureMonths,
      startDate,
      category,
      notes,
    });

    res.status(201).json(emi);
  } catch (err) {
    sendError(res, err);
  }
};

// MARK EMI PAID FOR THIS MONTH
// Also creates a matching Expense entry so this payment
// reflects in Expenses / Dashboard totals
const markPaid = async (req, res) => {
  try {
    const emi = await EMI.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!emi) {
      return res.status(404).json({ message: "EMI not found" });
    }

    if (emi.paidMonths >= emi.tenureMonths) {
      return res.status(400).json({ message: "EMI already fully paid" });
    }

    // Calculate next due date
    const nextDue = new Date(emi.startDate);
    nextDue.setMonth(nextDue.getMonth() + emi.paidMonths);

    // Check if next due date is still in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue > today) {
      return res.status(400).json({
        message: `Next EMI is due on ${nextDue.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}. You can mark it paid on or after that date.`,
      });
    }

    emi.paidMonths += 1;

    if (emi.paidMonths >= emi.tenureMonths) {
      emi.isActive = false;
    }

    await emi.save();

    // Auto-create matching Expense entry
    const expense = await Expense.create({
      userId: req.user.id,
      title: `${emi.name} EMI`,
      amount: emi.emiAmount,
      type: "expense",
      category: "Bills",
      date: new Date().toISOString().split("T")[0],
      notes: "Auto-added from EMI payment",
    });

    res.status(200).json({ emi, expense });
  } catch (err) {
    sendError(res, err);
  }
};

// GET LINKED EXPENSES — used to warn user before deleting
// an EMI that has auto-created expense entries tied to it.
// Matches by title pattern ("{EMI Name} EMI") + the specific
// notes tag used by markPaid(), so only genuinely linked
// entries are counted (not unrelated expenses with a similar name).
const getLinkedExpenses = async (req, res) => {
  try {
    const emi = await EMI.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!emi) {
      return res.status(404).json({ message: "EMI not found" });
    }

    const linked = await Expense.find({
      userId: req.user.id,
      title: `${emi.name} EMI`,
      notes: "Auto-added from EMI payment",
    });

    res.status(200).json({
      count: linked.length,
      total: linked.reduce((s, e) => s + e.amount, 0),
    });
  } catch (err) {
    sendError(res, err);
  }
};

// EDIT EMI
const editEMI = async (req, res) => {
  try {
    const emi = await EMI.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      pickFields(req.body, EMI_EDITABLE_FIELDS),
      { returnDocument: "after", runValidators: true },
    );
    if (!emi) {
      return res.status(404).json({ message: "EMI not found" });
    }
    res.status(200).json(emi);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE EMI
const deleteEMI = async (req, res) => {
  try {
    await EMI.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ message: "EMI deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getEMIs,
  addEMI,
  markPaid,
  getLinkedExpenses,
  editEMI,
  deleteEMI,
};
