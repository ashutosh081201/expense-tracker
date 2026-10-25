const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { generateAIInsights } = require("../controllers/aiInsightsController");

router.get("/generate", authMiddleware, generateAIInsights);

module.exports = router;
