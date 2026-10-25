jest.mock("../services/emailService", () => require("./mocks/emailService"));
jest.mock("@google/generative-ai", () => require("./mocks/generativeAI"));

const { setupDB, freezeDate, createUser, authed } = require("./helpers");
const Expense = require("../models/Expense");
const Saving = require("../models/Saving");
const NetWorthHistory = require("../models/NetWorthHistory");
const {
  snapshotAllUsersNetWorth,
} = require("../controllers/netWorthController");

setupDB();
afterEach(() => jest.useRealTimers());

describe("Bills", () => {
  let a;
  beforeEach(async () => {
    freezeDate("2026-10-25T10:00:00");
    a = authed((await createUser()).token);
  });

  const addBill = (name, dueDate, extra = {}) =>
    a
      .post("/api/bills")
      .send({ name, amount: 500, dueDate, ...extra })
      .expect(201);

  test("status is derived from day-of-month: overdue / due-today / due-soon (<=5d) / upcoming", async () => {
    await addBill("Rent", 20);
    await addBill("Power", 25);
    await addBill("Phone", 28);
    await addBill("Wifi", 30);
    await addBill("OTT", 31);

    const { body } = await a.get("/api/bills").expect(200);
    expect(body.map((x) => x.name)).toEqual([
      "Rent",
      "Power",
      "Phone",
      "Wifi",
      "OTT",
    ]); // sorted by due day
    expect(Object.fromEntries(body.map((x) => [x.name, x.status]))).toEqual({
      Rent: "overdue",
      Power: "due-today",
      Phone: "due-soon",
      Wifi: "due-soon",
      OTT: "upcoming",
    });
    expect(body[0].daysUntilDue).toBe(-5);
  });

  test("dueDate must be 1-31 and amount >= 1", async () => {
    await a
      .post("/api/bills")
      .send({ name: "x", amount: 500, dueDate: 32 })
      .expect(400);
    await a
      .post("/api/bills")
      .send({ name: "x", amount: 0, dueDate: 5 })
      .expect(400);
  });

  test("mark paid records punctuality, auto-creates a mapped Expense and blocks double payment", async () => {
    const late = await addBill("Electricity bill", 20, {
      category: "Electricity",
    });
    const ontime = await addBill("Netflix", 24, { category: "OTT" });

    const r1 = await a.put(`/api/bills/${late.body._id}/paid`).expect(200);
    expect(r1.body.bill.paymentHistory[0]).toMatchObject({
      month: "Oct 2026",
      dueDay: 20,
      paidOnDay: 25,
      onTime: false,
    });
    expect(r1.body.expense).toMatchObject({
      title: "Electricity bill",
      amount: 500,
      category: "Bills",
      notes: "Auto-added from Bill payment",
    });

    const r2 = await a.put(`/api/bills/${ontime.body._id}/paid`).expect(200);
    expect(r2.body.bill.paymentHistory[0].onTime).toBe(true); // within 2-day grace
    expect(r2.body.expense.category).toBe("Entertainment");

    await a.put(`/api/bills/${late.body._id}/paid`).expect(400);

    const list = (await a.get("/api/bills")).body;
    expect(list.every((x) => x.status === "paid" && x.isPaidThisMonth)).toBe(
      true,
    );

    const linked = await a
      .get(`/api/bills/${late.body._id}/linked`)
      .expect(200);
    expect(linked.body).toEqual({ count: 1, total: 500 });
  });

  test("linked expenses ignore unrelated expenses with the same title", async () => {
    const bill = await addBill("Gym", 26);
    await a
      .post("/api/expenses")
      .send({ title: "Gym", amount: 999, type: "expense" });
    await a.put(`/api/bills/${bill.body._id}/paid`);
    expect((await a.get(`/api/bills/${bill.body._id}/linked`)).body).toEqual({
      count: 1,
      total: 500,
    });
  });

  test("payment history keeps only the last 12 months", async () => {
    const bill = await addBill("Insurance", 10);
    for (let i = 0; i < 14; i++) {
      jest.setSystemTime(new Date(2025, i, 10, 10));
      await a.put(`/api/bills/${bill.body._id}/paid`).expect(200);
    }
    const b = (await a.get("/api/bills")).body[0];
    expect(b.paymentHistory).toHaveLength(12);
    expect(b.paymentHistory[0].month).toBe("Mar 2025");
    expect(b.paymentHistory[11].month).toBe("Feb 2026");
    expect(await Expense.countDocuments({ title: "Insurance" })).toBe(14);
  });

  test("edit / delete are scoped to the owner", async () => {
    const other = authed((await createUser("b@example.com")).token);
    const bill = await addBill("Water", 15);
    await other
      .put(`/api/bills/${bill.body._id}`)
      .send({ amount: 1 })
      .expect(404);
    await other.put(`/api/bills/${bill.body._id}/paid`).expect(404);
    await other.delete(`/api/bills/${bill.body._id}`).expect(200);
    expect((await a.get("/api/bills")).body).toHaveLength(1);

    const edited = await a
      .put(`/api/bills/${bill.body._id}`)
      .send({ amount: 750 })
      .expect(200);
    expect(edited.body.amount).toBe(750);
    await a.delete(`/api/bills/${bill.body._id}`).expect(200);
    expect((await a.get("/api/bills")).body).toHaveLength(0);
  });
});

describe("EMI", () => {
  let a;
  beforeEach(async () => {
    freezeDate("2026-10-25T10:00:00");
    a = authed((await createUser()).token);
  });

  test("pays month by month, refuses early payment, closes the loan when tenure completes", async () => {
    const emi = await a
      .post("/api/emi")
      .send({
        name: "Bike",
        totalAmount: 30000,
        emiAmount: 10000,
        tenureMonths: 3,
        startDate: "2026-08-25",
        category: "Car Loan",
      })
      .expect(201);
    const id = emi.body._id;

    await a.put(`/api/emi/${id}/paid`).expect(200); // Aug
    await a.put(`/api/emi/${id}/paid`).expect(200); // Sep
    const third = await a.put(`/api/emi/${id}/paid`).expect(200); // Oct (due today)
    expect(third.body.emi).toMatchObject({ paidMonths: 3, isActive: false });
    expect(third.body.expense).toMatchObject({
      title: "Bike EMI",
      amount: 10000,
      category: "Bills",
    });

    const done = await a.put(`/api/emi/${id}/paid`).expect(400);
    expect(done.body.message).toBe("EMI already fully paid");
    expect((await a.get(`/api/emi/${id}/linked`)).body).toEqual({
      count: 3,
      total: 30000,
    });
  });

  test("next instalment in the future -> 400 with due date", async () => {
    const emi = await a.post("/api/emi").send({
      name: "Phone",
      totalAmount: 12000,
      emiAmount: 1000,
      tenureMonths: 12,
      startDate: "2026-11-05",
    });
    const res = await a.put(`/api/emi/${emi.body._id}/paid`).expect(400);
    expect(res.body.message).toMatch(/Next EMI is due on 5 November 2026/);
    expect(await Expense.countDocuments()).toBe(0);
  });

  test("list, edit, delete and isolation", async () => {
    const other = authed((await createUser("b@example.com")).token);
    const emi = await a.post("/api/emi").send({
      name: "Home",
      totalAmount: 1e6,
      emiAmount: 1e4,
      tenureMonths: 100,
      startDate: "2026-01-01",
    });
    expect((await other.get("/api/emi")).body).toHaveLength(0);
    await other.put(`/api/emi/${emi.body._id}/paid`).expect(404);
    const upd = await a
      .put(`/api/emi/${emi.body._id}`)
      .send({ interestRate: 8.5 })
      .expect(200);
    expect(upd.body.interestRate).toBe(8.5);
    await a.delete(`/api/emi/${emi.body._id}`).expect(200);
    expect((await a.get("/api/emi")).body).toHaveLength(0);
  });
});

describe("Goals", () => {
  test("adding money creates linked savings and auto-completes at target", async () => {
    const a = authed((await createUser()).token);
    const goal = await a
      .post("/api/goals")
      .send({
        title: "Goa Trip",
        targetAmount: 1000,
        deadline: "2027-03-01",
        category: "Travel",
      })
      .expect(201);
    const id = goal.body._id;

    const r1 = await a
      .put(`/api/goals/${id}/addmoney`)
      .send({ amount: "400" })
      .expect(200);
    expect(r1.body.goal).toMatchObject({
      currentAmount: 400,
      isCompleted: false,
    });
    expect(r1.body.saving).toMatchObject({
      title: "Goal: Goa Trip",
      amount: 400,
      notes: "Auto-added from Goal contribution",
    });

    const r2 = await a
      .put(`/api/goals/${id}/addmoney`)
      .send({ amount: 800 })
      .expect(200);
    expect(r2.body.goal).toMatchObject({
      currentAmount: 1000,
      isCompleted: true,
    }); // capped at target

    // Note: the full 800 is still recorded as a Saving (documented in README)
    expect((await a.get(`/api/goals/${id}/linked`)).body).toEqual({
      count: 2,
      total: 1200,
    });
  });

  test.each([["abc"], [0], [-500], [undefined]])(
    "amount %p is rejected with 400 and creates no saving",
    async (amount) => {
      const a = authed((await createUser()).token);
      const goal = await a
        .post("/api/goals")
        .send({ title: "Car", targetAmount: 5000, deadline: "2027-01-01" });
      const res = await a
        .put(`/api/goals/${goal.body._id}/addmoney`)
        .send({ amount })
        .expect(400);
      expect(res.body.message).toBe("Amount must be a positive number");
      expect(await Saving.countDocuments()).toBe(0);
    },
  );

  test("goals are private to their owner", async () => {
    const a = authed((await createUser("a@example.com")).token);
    const b = authed((await createUser("b@example.com")).token);
    const goal = await a
      .post("/api/goals")
      .send({ title: "Car", targetAmount: 5000, deadline: "2027-01-01" });
    await b
      .put(`/api/goals/${goal.body._id}/addmoney`)
      .send({ amount: 10 })
      .expect(404);
    await b
      .put(`/api/goals/${goal.body._id}`)
      .send({ title: "Hacked" })
      .expect(404);
    expect((await b.get("/api/goals")).body).toHaveLength(0);
    const edited = await a
      .put(`/api/goals/${goal.body._id}`)
      .send({ title: "New Car" })
      .expect(200);
    expect(edited.body.title).toBe("New Car");
    await a.delete(`/api/goals/${goal.body._id}`).expect(200);
    expect((await a.get("/api/goals")).body).toHaveLength(0);
  });
});

describe("Net worth", () => {
  test("assets = savings + manual assets; liabilities = EMI outstanding + manual liabilities", async () => {
    freezeDate("2026-10-25T10:00:00");
    const a = authed((await createUser()).token);
    await a.post("/api/saving").send({ title: "FD", amount: 50000 });
    await a.post("/api/saving").send({ title: "MF", amount: 25000 });
    await a
      .post("/api/networth")
      .send({
        name: "Flat",
        value: 3000000,
        type: "asset",
        category: "Property",
      })
      .expect(201);
    const loan = await a
      .post("/api/networth")
      .send({ name: "Friend loan", value: 20000, type: "liability" })
      .expect(201);
    const emi = await a.post("/api/emi").send({
      name: "Car",
      totalAmount: 120000,
      emiAmount: 10000,
      tenureMonths: 12,
      startDate: "2026-10-01",
    });
    await a.put(`/api/emi/${emi.body._id}/paid`).expect(200); // 11 months left

    const { body } = await a.get("/api/networth").expect(200);
    expect(body.totalAssets).toBe(3075000);
    expect(body.totalLiabilities).toBe(110000 + 20000);
    expect(body.netWorth).toBe(3075000 - 130000);
    expect(body.breakdown.autoAssets[0]).toMatchObject({
      name: "Total Savings",
      value: 75000,
      auto: true,
    });
    expect(body.breakdown.autoLiabilities[0]).toMatchObject({
      name: "EMI Outstanding",
      value: 110000,
    });

    await a
      .put(`/api/networth/${loan.body._id}`)
      .send({ value: 0 })
      .expect(200);
    expect((await a.get("/api/networth")).body.totalLiabilities).toBe(110000);
    await a.delete(`/api/networth/${loan.body._id}`).expect(200);
    await a
      .post("/api/networth")
      .send({ name: "neg", value: -5, type: "asset" })
      .expect(400);
  });

  test("monthly snapshot stores the PREVIOUS month, is idempotent, and history is sorted chronologically", async () => {
    const alice = await createUser("a@example.com");
    const a = authed(alice.token);
    await a.post("/api/saving").send({ title: "Cash", amount: 1000 });

    freezeDate("2026-11-01T06:00:00");
    expect(await snapshotAllUsersNetWorth()).toBe(1);
    await snapshotAllUsersNetWorth();
    expect(await NetWorthHistory.countDocuments()).toBe(1);

    await NetWorthHistory.create({
      userId: alice.user.id,
      month: "Dec 2025",
      netWorth: 1,
      totalAssets: 1,
      totalLiabilities: 0,
    });
    await NetWorthHistory.create({
      userId: alice.user.id,
      month: "Mar 2026",
      netWorth: 2,
      totalAssets: 2,
      totalLiabilities: 0,
    });

    const { body } = await a.get("/api/networth/history").expect(200);
    expect(body.map((h) => h.month)).toEqual([
      "Dec 2025",
      "Mar 2026",
      "Oct 2026",
    ]);
    expect(body[2].netWorth).toBe(1000);
  });
});

describe("Edit protection on planning modules", () => {
  let alice, bob, a;
  beforeEach(async () => {
    freezeDate("2026-10-25T10:00:00");
    alice = await createUser("a@example.com");
    bob = await createUser("b@example.com");
    a = authed(alice.token);
  });

  test("bill: payment status and history cannot be forged via PUT", async () => {
    const bill = await a
      .post("/api/bills")
      .send({ name: "Rent", amount: 500, dueDate: 20 });
    const res = await a
      .put(`/api/bills/${bill.body._id}`)
      .send({
        userId: bob.user.id,
        lastPaidMonth: "Oct 2026",
        paymentHistory: [
          { month: "Oct 2026", dueDay: 20, paidOnDay: 1, onTime: true },
        ],
        amount: 650,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      amount: 650,
      lastPaidMonth: "",
      paymentHistory: [],
    });
    expect(res.body.userId).toBe(alice.user.id);
    expect((await a.get("/api/bills")).body[0].status).toBe("overdue");
  });

  test("EMI: paidMonths / isActive cannot be set via PUT", async () => {
    const emi = await a.post("/api/emi").send({
      name: "Car",
      totalAmount: 120000,
      emiAmount: 10000,
      tenureMonths: 12,
      startDate: "2026-01-01",
    });
    const res = await a
      .put(`/api/emi/${emi.body._id}`)
      .send({
        paidMonths: 12,
        isActive: false,
        userId: bob.user.id,
        notes: "ok",
      })
      .expect(200);
    expect(res.body).toMatchObject({
      paidMonths: 0,
      isActive: true,
      notes: "ok",
    });
    expect(res.body.userId).toBe(alice.user.id);
  });

  test("EMI: edits are schema-validated", async () => {
    const emi = await a.post("/api/emi").send({
      name: "Car",
      totalAmount: 120000,
      emiAmount: 10000,
      tenureMonths: 12,
      startDate: "2026-01-01",
    });
    await a
      .put(`/api/emi/${emi.body._id}`)
      .send({ tenureMonths: 0 })
      .expect(400);
    await a
      .put(`/api/emi/${emi.body._id}`)
      .send({ category: "Yacht" })
      .expect(400);
  });

  test("goal: progress cannot be faked via PUT", async () => {
    const goal = await a
      .post("/api/goals")
      .send({ title: "Trip", targetAmount: 1000, deadline: "2027-01-01" });
    const res = await a
      .put(`/api/goals/${goal.body._id}`)
      .send({ currentAmount: 1000, isCompleted: true, targetAmount: 2000 })
      .expect(200);
    expect(res.body).toMatchObject({
      currentAmount: 0,
      isCompleted: false,
      targetAmount: 2000,
    });
  });

  test("net worth: entries cannot be moved to another user or made negative", async () => {
    const entry = await a
      .post("/api/networth")
      .send({ name: "Gold", value: 1000, type: "asset" });
    await a
      .put(`/api/networth/${entry.body._id}`)
      .send({ value: -1 })
      .expect(400);
    await a
      .put(`/api/networth/${entry.body._id}`)
      .send({ userId: bob.user.id, value: 2000 })
      .expect(200);
    expect((await a.get("/api/networth")).body.totalAssets).toBe(2000);
    expect(
      (await authed(bob.token).get("/api/networth")).body.totalAssets,
    ).toBe(0);
  });
});
