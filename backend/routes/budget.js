const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getBudgets,
  setBudget,
  deleteBudget,
} = require("../controllers/budgetController");

router.get("/", authMiddleware, getBudgets);
router.post("/", authMiddleware, setBudget);
router.delete("/:id", authMiddleware, deleteBudget);

module.exports = router;
