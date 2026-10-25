const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getNetWorth,
  getNetWorthHistory,
  addEntry,
  editEntry,
  deleteEntry,
} = require("../controllers/netWorthController");

router.get("/", authMiddleware, getNetWorth);
router.get("/history", authMiddleware, getNetWorthHistory);
router.post("/", authMiddleware, addEntry);
router.put("/:id", authMiddleware, editEntry);
router.delete("/:id", authMiddleware, deleteEntry);

module.exports = router;
