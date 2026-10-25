const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getGoals,
  addGoal,
  addMoney,
  getLinkedSavings,
  editGoal,
  deleteGoal,
} = require("../controllers/goalController");

router.get("/", authMiddleware, getGoals);
router.post("/", authMiddleware, addGoal);
router.put("/:id/addmoney", authMiddleware, addMoney);
router.get("/:id/linked", authMiddleware, getLinkedSavings);
router.put("/:id", authMiddleware, editGoal);
router.delete("/:id", authMiddleware, deleteGoal);

module.exports = router;
