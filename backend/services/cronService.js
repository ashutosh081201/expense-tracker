const cron = require("node-cron");
const Bill = require("../models/Bill");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {
  sendBillReminderEmail,
  sendBudgetAlertEmail,
} = require("./emailService");
const {
  snapshotAllUsersNetWorth,
} = require("../controllers/netWorthController");

// ─── BILL REMINDER CRON ────────────────────────────────────
// Runs every day at 9:00 AM
const startBillReminderCron = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      const today = new Date();
      const todayDay = today.getDate();

      const currentMonth = today.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const bills = await Bill.find({ isActive: true }).populate(
        "userId",
        "name email",
      );

      const billsByUser = {};

      bills.forEach((bill) => {
        const isPaidThisMonth = bill.lastPaidMonth === currentMonth;
        if (isPaidThisMonth) return;

        const daysUntilDue = bill.dueDate - todayDay;
        let status = null;

        if (daysUntilDue < 0) status = "overdue";
        else if (daysUntilDue === 0) status = "due-today";
        else if (daysUntilDue > 0 && daysUntilDue <= 3) status = "due-soon";

        if (!status) return;

        const userId = bill.userId._id.toString();
        if (!billsByUser[userId]) {
          billsByUser[userId] = {
            user: bill.userId,
            bills: [],
          };
        }

        billsByUser[userId].bills.push({
          name: bill.name,
          amount: bill.amount,
          dueDate: bill.dueDate,
          status,
          daysUntilDue,
        });
      });

      for (const userId in billsByUser) {
        const { user, bills } = billsByUser[userId];
        try {
          await sendBillReminderEmail(user.email, user.name, bills);
        } catch (err) {
          console.error(
            `Failed to send bill reminder to ${user.email}:`,
            err.message,
          );
        }
      }
    } catch (err) {
      console.error("Bill reminder cron error:", err.message);
    }
  });
};

// ─── BUDGET ALERT CRON ─────────────────────────────────────
// Runs every day at 9:15 AM (right after bill reminders)
// Checks each user's CURRENT MONTH budgets, calculates actual
// spend from Expenses (same logic as budgetController), and
// emails a summary of any category at Warning (80%+) or
// Exceeded (100%+) status
const startBudgetAlertCron = () => {
  cron.schedule("15 9 * * *", async () => {
    try {
      const currentMonth = new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const budgets = await Budget.find({ month: currentMonth }).populate(
        "userId",
        "name email",
      );

      if (budgets.length === 0) return;

      // Group budgets by user
      const budgetsByUser = {};
      budgets.forEach((b) => {
        if (!b.userId) return;
        const userId = b.userId._id.toString();
        if (!budgetsByUser[userId]) {
          budgetsByUser[userId] = { user: b.userId, budgets: [] };
        }
        budgetsByUser[userId].budgets.push(b);
      });

      for (const userId in budgetsByUser) {
        const { user, budgets: userBudgets } = budgetsByUser[userId];

        try {
          // Calculate actual spend per category for this user,
          // this month — same approach as budgetController
          const expenses = await Expense.find({
            userId,
            type: "expense",
          });

          const spending = {};
          expenses.forEach((exp) => {
            const expMonth = new Date(exp.date).toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
            if (expMonth === currentMonth) {
              spending[exp.category] =
                (spending[exp.category] || 0) + exp.amount;
            }
          });

          const alerts = [];
          userBudgets.forEach((b) => {
            const spent = spending[b.category] || 0;
            const ratio = b.limit > 0 ? spent / b.limit : 0;

            if (ratio >= 1) {
              alerts.push({
                category: b.category,
                limit: b.limit,
                spent,
                status: "exceeded",
              });
            } else if (ratio >= 0.8) {
              alerts.push({
                category: b.category,
                limit: b.limit,
                spent,
                status: "warning",
              });
            }
          });

          if (alerts.length > 0) {
            await sendBudgetAlertEmail(
              user.email,
              user.name,
              currentMonth,
              alerts,
            );
          }
        } catch (err) {
          console.error(
            `Failed to process budget alert for ${user.email}:`,
            err.message,
          );
        }
      }
    } catch (err) {
      console.error("Budget alert cron error:", err.message);
    }
  });
};

// ─── NET WORTH MONTHLY SNAPSHOT CRON ──────────────────────
// Runs at 6:00 AM on the 1st of every month
const startNetWorthSnapshotCron = () => {
  cron.schedule("0 6 1 * *", async () => {
    try {
      await snapshotAllUsersNetWorth();
    } catch (err) {
      console.error("Net worth snapshot cron error:", err.message);
    }
  });
};

// ─── START ALL CRONS ───────────────────────────────────────
const startAllCrons = () => {
  startBillReminderCron();
  startBudgetAlertCron();
  startNetWorthSnapshotCron();
};

module.exports = { startAllCrons };
