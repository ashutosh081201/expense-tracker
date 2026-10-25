jest.mock("../services/emailService", () => require("./mocks/emailService"));
jest.mock("@google/generative-ai", () => require("./mocks/generativeAI"));

const { setupDB, freezeDate, createUser, authed } = require("./helpers");
const Expense = require("../models/Expense");

setupDB();
afterEach(() => jest.useRealTimers());

// Expenses, Income and Savings share the same CRUD + stats shape.
const resources = [
  {
    name: "expenses",
    url: "/api/expenses",
    sample: {
      title: "Groceries",
      amount: 1500,
      type: "expense",
      category: "Groceries",
      date: "2026-10-10",
    },
    category: "Groceries",
  },
  {
    name: "income",
    url: "/api/income",
    sample: {
      title: "Salary",
      amount: 80000,
      category: "Salary",
      date: "2026-10-01",
    },
    category: "Salary",
  },
  {
    name: "savings",
    url: "/api/saving",
    sample: {
      title: "FD",
      amount: 20000,
      category: "Fixed Deposit",
      date: "2026-10-05",
    },
    category: "Fixed Deposit",
  },
];

describe.each(resources)("$name CRUD", ({ url, sample }) => {
  let a, b;
  beforeEach(async () => {
    a = authed((await createUser("a@example.com")).token);
    b = authed((await createUser("b@example.com")).token);
  });

  test("create, list (newest first), update, delete", async () => {
    const created = await a.post(url).send(sample).expect(201);
    expect(created.body).toMatchObject({
      title: sample.title,
      amount: sample.amount,
    });

    await a
      .post(url)
      .send({ ...sample, title: "Older", date: "2026-01-01" })
      .expect(201);
    const list = await a.get(url).expect(200);
    expect(list.body.map((x) => x.title)).toEqual([sample.title, "Older"]);

    const upd = await a
      .put(`${url}/${created.body._id}`)
      .send({ amount: 999 })
      .expect(200);
    expect(upd.body.amount).toBe(999);

    await a.delete(`${url}/${created.body._id}`).expect(200);
    expect((await a.get(url)).body).toHaveLength(1);
  });

  test("users cannot see, edit or delete each other's entries", async () => {
    const mine = await a.post(url).send(sample);
    expect((await b.get(url)).body).toHaveLength(0);
    await b.put(`${url}/${mine.body._id}`).send({ amount: 1 }).expect(401);
    await b.delete(`${url}/${mine.body._id}`).expect(401);
    expect((await a.get(url)).body[0].amount).toBe(sample.amount);
  });

  test("404 for missing id", async () => {
    await a.put(`${url}/64b000000000000000000000`).send({}).expect(404);
    await a.delete(`${url}/64b000000000000000000000`).expect(404);
  });

  test("bulk delete removes only the caller's ids", async () => {
    const x = await a.post(url).send(sample);
    const y = await a.post(url).send(sample);
    const z = await a.post(url).send(sample);
    const other = await b.post(url).send(sample);

    await a
      .delete(`${url}/bulk`)
      .send({ ids: [x.body._id, y.body._id, other.body._id] })
      .expect(200);
    expect((await a.get(url)).body.map((e) => e._id)).toEqual([z.body._id]);
    expect((await b.get(url)).body).toHaveLength(1);
  });

  test("missing required fields -> 400 with validation message", async () => {
    const res = await a.post(url).send({ amount: 10 }).expect(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });
});

describe("Expense validation", () => {
  test("rejects invalid type and category enums", async () => {
    const a = authed((await createUser()).token);
    await a
      .post("/api/expenses")
      .send({ title: "x", amount: 1, type: "gift" })
      .expect(400);
    await a
      .post("/api/expenses")
      .send({ title: "x", amount: 1, type: "expense", category: "Pets" })
      .expect(400);
    const ok = await a
      .post("/api/expenses")
      .send({ title: "x", amount: 1, type: "expense" })
      .expect(201);
    expect(ok.body.category).toBe("Other");
  });
});

describe("Stats (6-month rolling window)", () => {
  test("expense stats bucket by month, split income/expense and exclude old data", async () => {
    freezeDate("2026-10-25T10:00:00");
    const a = authed((await createUser()).token);
    const add = (body) => a.post("/api/expenses").send(body).expect(201);

    await add({
      title: "Food1",
      amount: 300,
      type: "expense",
      category: "Food",
      date: "2026-10-03",
    });
    await add({
      title: "Food2",
      amount: 100,
      type: "expense",
      category: "Food",
      date: "2026-09-15",
    });
    await add({
      title: "Fuel",
      amount: 600,
      type: "expense",
      category: "Fuel",
      date: "2026-05-20",
    });
    await add({
      title: "Refund",
      amount: 50,
      type: "income",
      category: "Other",
      date: "2026-10-04",
    });
    await add({
      title: "Ancient",
      amount: 99999,
      type: "expense",
      category: "Food",
      date: "2025-01-01",
    });

    const { body } = await a.get("/api/expenses/stats").expect(200);
    expect(body.months).toEqual([
      "May 2026",
      "Jun 2026",
      "Jul 2026",
      "Aug 2026",
      "Sep 2026",
      "Oct 2026",
    ]);
    expect(body.categoryStats).toEqual({ Food: 400, Fuel: 600 });
    expect(body.categoryPercent).toEqual({ Food: "40.0", Fuel: "60.0" });
    expect(body.monthlyExpense["Oct 2026"]).toBe(300);
    expect(body.monthlyIncome["Oct 2026"]).toBe(50);
    expect(body.monthlyExpense["Jun 2026"]).toBe(0);

    const cm = await a.get("/api/expenses/category-month").expect(200);
    expect(Object.keys(cm.body.categoryMonthData).sort()).toEqual([
      "Food",
      "Fuel",
    ]);
    expect(cm.body.categoryMonthData.Food["Sep 2026"]).toBe(100);
  });

  test("income and saving stats produce category/month breakdowns", async () => {
    freezeDate("2026-10-25T10:00:00");
    const a = authed((await createUser()).token);
    await a.post("/api/income").send({
      title: "S",
      amount: 70000,
      category: "Salary",
      date: "2026-10-01",
    });
    await a.post("/api/income").send({
      title: "F",
      amount: 30000,
      category: "Freelance",
      date: "2026-08-01",
    });
    await a
      .post("/api/saving")
      .send({ title: "G", amount: 5000, category: "Gold", date: "2026-10-02" });

    const inc = (await a.get("/api/income/stats").expect(200)).body;
    expect(inc.categoryPercent).toEqual({ Salary: "70.0", Freelance: "30.0" });
    expect(inc.monthlyStats["Aug 2026"]).toBe(30000);
    expect(Object.keys(inc.categoryMonthData).sort()).toEqual([
      "Freelance",
      "Salary",
    ]);

    const sav = (await a.get("/api/saving/stats").expect(200)).body;
    expect(sav.categoryStats).toEqual({ Gold: 5000 });
    expect(sav.monthlyStats["Oct 2026"]).toBe(5000);
  });

  test("stats for a user with no data are empty but well-formed", async () => {
    const a = authed((await createUser()).token);
    const { body } = await a.get("/api/expenses/stats").expect(200);
    expect(body.months).toHaveLength(6);
    expect(body.categoryStats).toEqual({});
  });
});

describe("Budgets", () => {
  test("status is safe <80%, warning 80-99%, exceeded >=100%, current month only", async () => {
    freezeDate("2026-10-25T10:00:00");
    const a = authed((await createUser()).token);
    const month = "Oct 2026";
    for (const [category, limit] of [
      ["Food", 1000],
      ["Travel", 1000],
      ["Shopping", 1000],
    ]) {
      await a.post("/api/budget").send({ category, limit, month }).expect(200);
    }
    const spend = (category, amount, date = "2026-10-10") =>
      a
        .post("/api/expenses")
        .send({ title: category, amount, type: "expense", category, date });
    await spend("Food", 500);
    await spend("Food", 9999, "2026-09-10"); // previous month, ignored
    await spend("Travel", 800);
    await spend("Shopping", 1200);
    await a.post("/api/expenses").send({
      title: "inc",
      amount: 5000,
      type: "income",
      category: "Food",
      date: "2026-10-10",
    });

    const { body } = await a.get("/api/budget").expect(200);
    expect(body.month).toBe(month);
    const byCat = Object.fromEntries(body.budgets.map((x) => [x.category, x]));
    expect(byCat.Food).toMatchObject({
      spent: 500,
      percent: 50,
      status: "safe",
    });
    expect(byCat.Travel).toMatchObject({
      spent: 800,
      percent: 80,
      status: "warning",
    });
    expect(byCat.Shopping).toMatchObject({
      spent: 1200,
      percent: 120,
      status: "exceeded",
    });

    const sep = await a.get("/api/budget?month=Sep 2026").expect(200);
    expect(sep.body.budgets).toHaveLength(0);
  });

  test("setting the same category+month twice upserts instead of duplicating", async () => {
    const a = authed((await createUser()).token);
    await a
      .post("/api/budget")
      .send({ category: "Food", limit: 1000, month: "Oct 2026" });
    await a
      .post("/api/budget")
      .send({ category: "Food", limit: 2500, month: "Oct 2026" });
    const { body } = await a.get("/api/budget?month=Oct 2026");
    expect(body.budgets).toHaveLength(1);
    expect(body.budgets[0].limit).toBe(2500);
  });

  test("delete only affects the owner's budget", async () => {
    const a = authed((await createUser("a@example.com")).token);
    const b = authed((await createUser("b@example.com")).token);
    const bud = await a
      .post("/api/budget")
      .send({ category: "Food", limit: 1000, month: "Oct 2026" });
    await b.delete(`/api/budget/${bud.body._id}`).expect(200);
    expect(
      (await a.get("/api/budget?month=Oct 2026")).body.budgets,
    ).toHaveLength(1);
    await a.delete(`/api/budget/${bud.body._id}`).expect(200);
    expect(
      (await a.get("/api/budget?month=Oct 2026")).body.budgets,
    ).toHaveLength(0);
  });
});

describe("Edit protection (mass assignment)", () => {
  test.each(resources)(
    "$name: PUT ignores userId and other non-editable fields",
    async ({ url, sample }) => {
      const alice = await createUser("a@example.com");
      const bob = await createUser("b@example.com");
      const a = authed(alice.token);
      const created = await a.post(url).send(sample);

      const res = await a
        .put(`${url}/${created.body._id}`)
        .send({
          userId: bob.user.id,
          _id: "64b000000000000000000000",
          title: "Renamed",
        })
        .expect(200);
      expect(res.body._id).toBe(created.body._id);
      expect(res.body.userId).toBe(alice.user.id);
      expect(res.body.title).toBe("Renamed");
      expect((await authed(bob.token).get(url)).body).toHaveLength(0);
    },
  );

  test("edits are validated against the schema", async () => {
    const a = authed((await createUser()).token);
    const e = await a
      .post("/api/expenses")
      .send({ title: "x", amount: 1, type: "expense" });
    const res = await a
      .put(`/api/expenses/${e.body._id}`)
      .send({ category: "Pets" })
      .expect(400);
    expect(res.body.message).toMatch(/Pets/);
    expect((await Expense.findById(e.body._id)).category).toBe("Other");
  });

  test("malformed ids -> 400 instead of 500", async () => {
    const a = authed((await createUser()).token);
    await a.put("/api/expenses/not-an-id").send({ amount: 1 }).expect(400);
    await a.delete("/api/income/not-an-id").expect(400);
  });
});
