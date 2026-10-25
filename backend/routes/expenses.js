const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getExpenses,
  addExpense,
  editExpense,
  deleteExpense,
  getStats,
  getCategoryMonthStats,
  bulkDeleteExpenses,
} = require("../controllers/expenseController");

// ⚠️ /bulk and /stats MUST come before /:id
router.get("/", authMiddleware, getExpenses);
router.post("/", authMiddleware, addExpense);
router.get("/stats", authMiddleware, getStats);
router.get("/category-month", authMiddleware, getCategoryMonthStats);
router.delete("/bulk", authMiddleware, bulkDeleteExpenses);

// /:id routes MUST come last
router.put("/:id", authMiddleware, editExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
