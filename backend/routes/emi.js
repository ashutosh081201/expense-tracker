const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getEMIs,
  addEMI,
  markPaid,
  getLinkedExpenses,
  editEMI,
  deleteEMI,
} = require("../controllers/emiController");

router.get("/", authMiddleware, getEMIs);
router.post("/", authMiddleware, addEMI);
router.put("/:id/paid", authMiddleware, markPaid);
router.get("/:id/linked", authMiddleware, getLinkedExpenses);
router.put("/:id", authMiddleware, editEMI);
router.delete("/:id", authMiddleware, deleteEMI);

module.exports = router;
