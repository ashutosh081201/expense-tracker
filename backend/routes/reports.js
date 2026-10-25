const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateReport,
  getSnapshot,
} = require("../controllers/reportController");

router.get("/generate", authMiddleware, generateReport);
router.get("/snapshot", authMiddleware, getSnapshot);

module.exports = router;
