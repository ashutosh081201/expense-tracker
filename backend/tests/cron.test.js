jest.mock("../services/emailService", () => require("./mocks/emailService"));
jest.mock("@google/generative-ai", () => require("./mocks/generativeAI"));
jest.mock("node-cron", () => ({ schedule: jest.fn() }));

const cron = require("node-cron");
const { setupDB, freezeDate, createUser, authed } = require("./helpers");
const emailService = require("./mocks/emailService");
const NetWorthHistory = require("../models/NetWorthHistory");
const { startAllCrons } = require("../services/cronService");

setupDB();

// Capture each scheduled job so tests can run it on demand.
let jobs;
beforeAll(() => {
  startAllCrons();
  jobs = Object.fromEntries(
    cron.schedule.mock.calls.map(([expr, fn]) => [expr, fn]),
  );
});
afterEach(() => {
  jest.useRealTimers();
  Object.values(emailService).forEach((fn) => fn.mockClear());
});

test("registers three jobs on the expected schedules", () => {
  expect(Object.keys(jobs).sort()).toEqual([
    "0 6 1 * *",
    "0 9 * * *",
    "15 9 * * *",
  ]);
});

test("daily bill reminder emails each user only their unpaid overdue / due-today / due-in-3-days bills", async () => {
  freezeDate("2026-10-25T09:00:00");
  const alice = authed(
    (await createUser("a@example.com", "pw", "Alice")).token,
  );
  const bob = authed((await createUser("b@example.com", "pw", "Bob")).token);
  await alice.post("/api/bills").send({ name: "Rent", amount: 1, dueDate: 20 }); // overdue
  await alice
    .post("/api/bills")
    .send({ name: "Power", amount: 1, dueDate: 25 }); // today
  await alice
    .post("/api/bills")
    .send({ name: "Phone", amount: 1, dueDate: 28 }); // in 3 days
  await alice.post("/api/bills").send({ name: "Wifi", amount: 1, dueDate: 29 }); // 4 days: no reminder
  const paid = await alice
    .post("/api/bills")
    .send({ name: "Gas", amount: 1, dueDate: 22 });
  await alice.put(`/api/bills/${paid.body._id}/paid`);
  await bob.post("/api/bills").send({ name: "OTT", amount: 1, dueDate: 30 }); // 5 days: no reminder

  await jobs["0 9 * * *"]();

  expect(emailService.sendBillReminderEmail).toHaveBeenCalledTimes(1);
  const [to, name, bills] = emailService.sendBillReminderEmail.mock.calls[0];
  expect([to, name]).toEqual(["a@example.com", "Alice"]);
  expect(bills.map((b) => [b.name, b.status])).toEqual(
    expect.arrayContaining([
      ["Rent", "overdue"],
      ["Power", "due-today"],
      ["Phone", "due-soon"],
    ]),
  );
  expect(bills).toHaveLength(3);
});

test("daily budget alert emails categories at >=80% for the current month", async () => {
  freezeDate("2026-10-25T09:15:00");
  const a = authed((await createUser("a@example.com", "pw", "Alice")).token);
  for (const [category, limit, spent] of [
    ["Food", 1000, 500],
    ["Travel", 1000, 850],
    ["Fuel", 1000, 1100],
  ]) {
    await a.post("/api/budget").send({ category, limit, month: "Oct 2026" });
    await a.post("/api/expenses").send({
      title: category,
      amount: spent,
      type: "expense",
      category,
      date: "2026-10-05",
    });
  }

  await jobs["15 9 * * *"]();

  expect(emailService.sendBudgetAlertEmail).toHaveBeenCalledTimes(1);
  const [to, , month, alerts] = emailService.sendBudgetAlertEmail.mock.calls[0];
  expect(to).toBe("a@example.com");
  expect(month).toBe("Oct 2026");
  expect(alerts.map((x) => [x.category, x.status]).sort()).toEqual([
    ["Fuel", "exceeded"],
    ["Travel", "warning"],
  ]);
});

test("a failing email for one user does not stop the job", async () => {
  freezeDate("2026-10-25T09:00:00");
  const a = authed((await createUser("a@example.com")).token);
  const b = authed((await createUser("b@example.com")).token);
  await a.post("/api/bills").send({ name: "Rent", amount: 1, dueDate: 20 });
  await b.post("/api/bills").send({ name: "Rent", amount: 1, dueDate: 20 });
  emailService.sendBillReminderEmail.mockRejectedValueOnce(
    new Error("SMTP down"),
  );
  jest.spyOn(console, "error").mockImplementation(() => {});

  await jobs["0 9 * * *"]();
  expect(emailService.sendBillReminderEmail).toHaveBeenCalledTimes(2);
  console.error.mockRestore();
});

test("monthly job snapshots net worth for every user", async () => {
  const a = authed((await createUser("a@example.com")).token);
  await createUser("b@example.com");
  await a.post("/api/saving").send({ title: "x", amount: 500 });
  freezeDate("2026-11-01T06:00:00");
  jest.spyOn(console, "log").mockImplementation(() => {});

  await jobs["0 6 1 * *"]();
  const rows = await NetWorthHistory.find().sort({ netWorth: -1 });
  expect(rows.map((r) => [r.month, r.netWorth])).toEqual([
    ["Oct 2026", 500],
    ["Oct 2026", 0],
  ]);
  console.log.mockRestore();
});
