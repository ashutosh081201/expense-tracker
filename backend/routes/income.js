const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getIncomes,
  addIncome,
  editIncome,
  deleteIncome,
  getIncomeStats,
  bulkDeleteIncomes,
} = require("../controllers/incomeController");

router.get("/", authMiddleware, getIncomes);
router.post("/", authMiddleware, addIncome);
router.get("/stats", authMiddleware, getIncomeStats);
router.delete("/bulk", authMiddleware, bulkDeleteIncomes);

router.put("/:id", authMiddleware, editIncome);
router.delete("/:id", authMiddleware, deleteIncome);

module.exports = router;
