jest.mock("../services/emailService", () => require("./mocks/emailService"));
jest.mock("@google/generative-ai", () => require("./mocks/generativeAI"));

const { setupDB, freezeDate, createUser, authed } = require("./helpers");
const { generateContent, getGenerativeModel } = require("./mocks/generativeAI");

setupDB();
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

const seed = async (a) => {
  await a.post("/api/income").send({
    title: "Salary",
    amount: 100000,
    category: "Salary",
    date: "2026-10-01",
  });
  await a.post("/api/income").send({
    title: "Old salary",
    amount: 90000,
    category: "Salary",
    date: "2026-09-01",
  });
  await a.post("/api/expenses").send({
    title: "Rent",
    amount: 30000,
    type: "expense",
    category: "Bills",
    date: "2026-10-02",
  });
  await a.post("/api/expenses").send({
    title: "Food",
    amount: 8000,
    type: "expense",
    category: "Food",
    date: "2026-10-12",
  });
  await a.post("/api/expenses").send({
    title: "Last yr",
    amount: 5000,
    type: "expense",
    category: "Food",
    date: "2025-12-12",
  });
  await a.post("/api/saving").send({
    title: "SIP",
    amount: 20000,
    category: "Mutual Funds",
    date: "2026-10-05",
  });
};

describe("Reports", () => {
  let a;
  beforeEach(async () => {
    freezeDate("2026-10-25T10:00:00");
    a = authed((await createUser()).token);
    await seed(a);
  });

  test("periodType is required; custom requires both dates", async () => {
    await a.get("/api/reports/generate?type=all").expect(400);
    await a
      .get(
        "/api/reports/generate?periodType=custom&type=all&startDate=2026-01-01",
      )
      .expect(400);
  });

  test("this-month report totals each section by category", async () => {
    const { body } = await a
      .get("/api/reports/generate?periodType=this-month&type=all")
      .expect(200);
    expect(body.period.label).toBe("1 Oct 2026 - 31 Oct 2026");
    expect(body.data.expenses).toMatchObject({
      total: 38000,
      count: 2,
      categoryTotals: { Bills: 30000, Food: 8000 },
    });
    expect(body.data.income).toMatchObject({ total: 100000, count: 1 });
    expect(body.data.savings).toMatchObject({
      total: 20000,
      categoryTotals: { "Mutual Funds": 20000 },
    });
  });

  test("type filter returns only the requested section", async () => {
    const { body } = await a
      .get("/api/reports/generate?periodType=this-year&type=income")
      .expect(200);
    expect(Object.keys(body.data)).toEqual(["income"]);
    expect(body.data.income.total).toBe(190000);
  });

  test("last-month, last-year and custom ranges", async () => {
    const lm = (
      await a.get("/api/reports/generate?periodType=last-month&type=income")
    ).body;
    expect(lm.data.income.total).toBe(90000);
    const ly = (
      await a.get("/api/reports/generate?periodType=last-year&type=expenses")
    ).body;
    expect(ly.data.expenses.total).toBe(5000);
    const c = (
      await a.get(
        "/api/reports/generate?periodType=custom&type=expenses&startDate=2026-10-10&endDate=2026-10-12",
      )
    ).body;
    expect(c.data.expenses.total).toBe(8000); // end date is inclusive
  });

  test("last-quarter in January wraps to Q4 of the previous year", async () => {
    // Jumping ~3 months ahead expires the 7-day JWT, so sign in fresh
    jest.setSystemTime(new Date("2027-01-15T10:00:00"));
    a = authed((await createUser("jan@example.com")).token);
    await seed(a);
    const { body } = await a
      .get("/api/reports/generate?periodType=last-quarter&type=all")
      .expect(200);
    expect(body.period.label).toBe("1 Oct 2026 - 31 Dec 2026");
    expect(body.data.income.total).toBe(100000);
  });

  test("snapshot aggregates budget, goals, EMI, bills and net worth", async () => {
    await a
      .post("/api/budget")
      .send({ category: "Food", limit: 10000, month: "Oct 2026" });
    await a
      .post("/api/goals")
      .send({ title: "Laptop", targetAmount: 80000, deadline: "2027-01-01" });
    await a.post("/api/emi").send({
      name: "Car",
      totalAmount: 60000,
      emiAmount: 5000,
      tenureMonths: 12,
      startDate: "2026-12-01",
    });
    await a.post("/api/bills").send({ name: "Wifi", amount: 999, dueDate: 3 });

    const { body } = await a.get("/api/reports/snapshot").expect(200);
    expect(body.month).toBe("Oct 2026");
    expect(body.budget).toMatchObject({ totalLimit: 10000, totalSpent: 8000 });
    expect(body.budget.entries[0].status).toBe("warning");
    expect(body.goals).toMatchObject({ totalTarget: 80000, completedCount: 0 });
    expect(body.emi).toMatchObject({
      monthlyOutflow: 5000,
      totalOutstanding: 60000,
    });
    expect(body.bills).toMatchObject({ monthlyTotal: 999, overdueCount: 1 });
    expect(body.netWorth.netWorth).toBe(20000 - 60000);
  });
});

describe("AI insights (Gemini mocked)", () => {
  let a;
  const insights = {
    spending: ["You spent ₹38,000."],
    budget: [],
    savings: ["Savings rate is 20%."],
    goals: [],
    billsAndEmi: [],
    netWorth: [],
    healthScore: ["Score 100."],
    predictions: [],
  };
  const reply = (text) => ({ response: { text: () => text } });

  beforeEach(async () => {
    freezeDate("2026-10-25T10:00:00");
    a = authed((await createUser()).token);
    await seed(a);
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test("computes the health score server-side and returns parsed insights (code fences stripped)", async () => {
    generateContent.mockResolvedValueOnce(
      reply("```json\n" + JSON.stringify(insights) + "\n```"),
    );
    const { body } = await a
      .get("/api/ai-insights/generate?periodType=this-month")
      .expect(200);

    expect(body.summary).toEqual({
      healthScore: 100, // 30 savings (20%) + 30 budget (none) + 25 EMI (none) + 15 positive balance
      totalIncome: 100000,
      totalExpense: 38000,
      totalSavings: 20000,
      netWorth: 20000,
    });
    expect(body.insights).toEqual(insights);
    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-flash-latest",
    });

    // The prompt carries the structured summary and the no-advice guardrails
    const prompt = generateContent.mock.calls[0][0];
    expect(prompt).toMatch(/NEVER prescriptive/);
    expect(prompt).toContain('"total": 38000');
    expect(prompt).toContain('"previousTotal": 90000'); // previous-period comparison for income
  });

  test("health score drops with exceeded budgets, heavy EMI and negative cash flow", async () => {
    await a
      .post("/api/budget")
      .send({ category: "Food", limit: 5000, month: "Oct 2026" }); // exceeded
    await a
      .post("/api/budget")
      .send({ category: "Bills", limit: 35000, month: "Oct 2026" }); // 85% warning
    await a.post("/api/emi").send({
      name: "Home",
      totalAmount: 5e6,
      emiAmount: 45000,
      tenureMonths: 120,
      startDate: "2026-01-01",
    }); // 45% of income
    await a.post("/api/expenses").send({
      title: "Car",
      amount: 70000,
      type: "expense",
      category: "Other",
      date: "2026-10-20",
    });
    generateContent.mockResolvedValueOnce(reply(JSON.stringify(insights)));

    const { body } = await a
      .get("/api/ai-insights/generate?periodType=this-month")
      .expect(200);
    // savings 30 + budget (30-10-4=16) + emi 5 + balance 0
    expect(body.summary.healthScore).toBe(51);
  });

  test("validates query params", async () => {
    await a.get("/api/ai-insights/generate").expect(400);
    await a.get("/api/ai-insights/generate?periodType=custom").expect(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  test("unparseable model output -> 500", async () => {
    generateContent.mockResolvedValueOnce(
      reply("Sorry, I can't help with that."),
    );
    const res = await a
      .get("/api/ai-insights/generate?periodType=this-month")
      .expect(500);
    expect(res.body.message).toBe("Failed to parse AI insights response");
  });

  test("retries once on a 503 and then succeeds", async () => {
    generateContent
      .mockRejectedValueOnce(
        Object.assign(new Error("503 overloaded"), { status: 503 }),
      )
      .mockResolvedValueOnce(reply(JSON.stringify(insights)));
    await a.get("/api/ai-insights/generate?periodType=this-month").expect(200);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  test("gives up after 3 attempts with a friendly 503", async () => {
    generateContent.mockRejectedValue(
      Object.assign(new Error("503"), { status: 503 }),
    );
    const res = await a
      .get("/api/ai-insights/generate?periodType=this-month")
      .expect(503);
    expect(res.body.message).toMatch(/currently busy/);
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  test("non-retryable errors fail fast", async () => {
    generateContent.mockRejectedValue(new Error("API key invalid"));
    const res = await a
      .get("/api/ai-insights/generate?periodType=this-month")
      .expect(500);
    expect(res.body.message).toBe("API key invalid");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});

describe("Profile", () => {
  test("returns user without password plus entry counts; updates name/colour", async () => {
    const a = authed((await createUser()).token);
    await a
      .post("/api/expenses")
      .send({ title: "x", amount: 1, type: "expense" });
    await a.post("/api/income").send({ title: "y", amount: 1 });

    const { body } = await a.get("/api/profile").expect(200);
    expect(body.user.password).toBeUndefined();
    expect(body.stats).toEqual({
      expenses: 1,
      incomes: 1,
      savings: 0,
      total: 2,
    });

    const upd = await a
      .put("/api/profile")
      .send({ name: "Alicia", avatarColor: "#16a34a" })
      .expect(200);
    expect(upd.body.user).toMatchObject({
      name: "Alicia",
      avatarColor: "#16a34a",
    });
    expect(upd.body.user.password).toBeUndefined();
  });
});
