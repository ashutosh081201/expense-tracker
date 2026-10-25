const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getSavings,
  addSaving,
  editSaving,
  deleteSaving,
  getSavingStats,
  bulkDeleteSavings,
} = require("../controllers/savingController");

router.get("/", authMiddleware, getSavings);
router.post("/", authMiddleware, addSaving);
router.get("/stats", authMiddleware, getSavingStats);
router.delete("/bulk", authMiddleware, bulkDeleteSavings);

router.put("/:id", authMiddleware, editSaving);
router.delete("/:id", authMiddleware, deleteSaving);

module.exports = router;
