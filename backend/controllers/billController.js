const Bill = require("../models/Bill");
const Expense = require("../models/Expense");
const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

// Fields a client may change via PUT /:id
const BILL_EDITABLE_FIELDS = ["name", "amount", "dueDate", "category", "notes"];

// Map Bill categories → valid Expense categories
const BILL_TO_EXPENSE_CATEGORY = {
  Electricity: "Bills",
  Water: "Bills",
  Internet: "Bills",
  Mobile: "Bills",
  OTT: "Entertainment",
  Insurance: "Bills",
  Rent: "Bills",
  Gas: "Bills",
  "Credit Card": "Bills",
  Other: "Other",
};

// GET ALL BILLS
const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      userId: req.user.id,
      isActive: true,
    }).sort({ dueDate: 1 });

    const today = new Date();
    const todayDay = today.getDate();
    const currentMonth = today.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    const result = bills.map((bill) => {
      const isPaidThisMonth = bill.lastPaidMonth === currentMonth;

      let status = "upcoming";
      if (!isPaidThisMonth) {
        const daysUntilDue = bill.dueDate - todayDay;
        if (daysUntilDue < 0) status = "overdue";
        else if (daysUntilDue === 0) status = "due-today";
        else if (daysUntilDue > 0 && daysUntilDue <= 5) status = "due-soon";
        else status = "upcoming";
      } else {
        status = "paid";
      }

      const daysUntilDue = bill.dueDate - todayDay;

      return {
        _id: bill._id,
        name: bill.name,
        amount: bill.amount,
        dueDate: bill.dueDate,
        category: bill.category,
        notes: bill.notes,
        isActive: bill.isActive,
        lastPaidMonth: bill.lastPaidMonth,
        paymentHistory: bill.paymentHistory,
        createdAt: bill.createdAt,
        status,
        daysUntilDue,
        isPaidThisMonth,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    sendError(res, err);
  }
};

// ADD BILL
const addBill = async (req, res) => {
  try {
    const { name, amount, dueDate, category, notes } = req.body;
    const bill = await Bill.create({
      userId: req.user.id,
      name,
      amount,
      dueDate,
      category,
      notes,
    });
    res.status(201).json(bill);
  } catch (err) {
    sendError(res, err);
  }
};

// MARK BILL AS PAID FOR THIS MONTH
// Also creates a matching Expense entry so this payment
// reflects in Expenses / Dashboard totals
const markPaid = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const today = new Date();
    const todayDay = today.getDate();
    const currentMonth = today.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    if (bill.lastPaidMonth === currentMonth) {
      return res.status(400).json({
        message: "Bill already marked as paid for this month",
      });
    }

    // Determine on-time status (2-day grace period)
    const onTime = todayDay <= bill.dueDate + 2;

    bill.lastPaidMonth = currentMonth;
    bill.paymentHistory.push({
      month: currentMonth,
      dueDay: bill.dueDate,
      paidOnDay: todayDay,
      onTime,
    });

    // Keep only last 12 months of history to avoid unbounded growth
    if (bill.paymentHistory.length > 12) {
      bill.paymentHistory = bill.paymentHistory.slice(-12);
    }

    await bill.save();

    // Map bill category to a valid Expense category
    const expenseCategory = BILL_TO_EXPENSE_CATEGORY[bill.category] || "Other";

    // Auto-create matching Expense entry
    const expense = await Expense.create({
      userId: req.user.id,
      title: bill.name,
      amount: bill.amount,
      type: "expense",
      category: expenseCategory,
      date: today.toISOString().split("T")[0],
      notes: "Auto-added from Bill payment",
    });

    res.status(200).json({ bill, expense });
  } catch (err) {
    sendError(res, err);
  }
};

// GET LINKED EXPENSES — used to warn user before deleting
// a Bill that has auto-created expense entries tied to it.
// Matches by title (exact bill name) + the specific notes
// tag used by markPaid(), so only genuinely linked entries
// are counted (not unrelated expenses with the same title).
const getLinkedExpenses = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const linked = await Expense.find({
      userId: req.user.id,
      title: bill.name,
      notes: "Auto-added from Bill payment",
    });

    res.status(200).json({
      count: linked.length,
      total: linked.reduce((s, e) => s + e.amount, 0),
    });
  } catch (err) {
    sendError(res, err);
  }
};

// EDIT BILL
const editBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      pickFields(req.body, BILL_EDITABLE_FIELDS),
      { returnDocument: "after", runValidators: true },
    );
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.status(200).json(bill);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE BILL
const deleteBill = async (req, res) => {
  try {
    await Bill.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json({ message: "Bill deleted" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getBills,
  addBill,
  markPaid,
  getLinkedExpenses,
  editBill,
  deleteBill,
};
