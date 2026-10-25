require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startAllCrons } = require("./services/cronService");

// Connect to MongoDB
connectDB();

// Start cron jobs after DB connects
startAllCrons();

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
