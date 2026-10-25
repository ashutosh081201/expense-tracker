const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/income", require("./routes/income"));
app.use("/api/saving", require("./routes/saving"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/budget", require("./routes/budget"));
app.use("/api/goals", require("./routes/goal"));
app.use("/api/emi", require("./routes/emi"));
app.use("/api/bills", require("./routes/bill"));
app.use("/api/networth", require("./routes/networth"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/ai-insights", require("./routes/aiInsights"));

module.exports = app;
