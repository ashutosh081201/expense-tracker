const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getBills,
  addBill,
  markPaid,
  getLinkedExpenses,
  editBill,
  deleteBill,
} = require("../controllers/billController");

router.get("/", authMiddleware, getBills);
router.post("/", authMiddleware, addBill);
router.put("/:id/paid", authMiddleware, markPaid);
router.get("/:id/linked", authMiddleware, getLinkedExpenses);
router.put("/:id", authMiddleware, editBill);
router.delete("/:id", authMiddleware, deleteBill);

module.exports = router;
