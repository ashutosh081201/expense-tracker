jest.mock("../services/emailService", () => require("./mocks/emailService"));
jest.mock("@google/generative-ai", () => require("./mocks/generativeAI"));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { app, setupDB, latestOTP, createUser, authed } = require("./helpers");
const emailService = require("../services/emailService");
const User = require("../models/User");
const OTP = require("../models/OTP");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");

setupDB();
beforeEach(() => jest.clearAllMocks());

describe("Health check", () => {
  test("GET / responds", async () => {
    const res = await request(app).get("/").expect(200);
    expect(res.body.message).toBe("Server is running");
  });
});

describe("Registration & email verification", () => {
  test("register hashes password, creates unverified user and emails a 6-digit OTP", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Bob", email: "bob@example.com", password: "pass1234" })
      .expect(201);

    const user = await User.findOne({ email: "bob@example.com" });
    expect(user.isEmailVerified).toBe(false);
    expect(user.password).not.toBe("pass1234");
    expect(await bcrypt.compare("pass1234", user.password)).toBe(true);

    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    const [to, otp] = emailService.sendVerificationEmail.mock.calls[0];
    expect(to).toBe("bob@example.com");
    expect(otp).toMatch(/^\d{6}$/);
  });

  test("duplicate email is rejected", async () => {
    await createUser("dup@example.com");
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "dup@example.com", password: "x" })
      .expect(400);
    expect(res.body.message).toBe("User already exists");
  });

  test("wrong OTP is rejected, correct OTP verifies and returns a 7-day JWT", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "C", email: "c@example.com", password: "pw" });
    const otp = await latestOTP("c@example.com", "email-verify");
    const wrong = otp === "111111" ? "222222" : "111111";

    await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "c@example.com", otp: wrong })
      .expect(400);

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "c@example.com", otp })
      .expect(200);

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
    expect(res.body.user).toMatchObject({ name: "C", email: "c@example.com" });
    expect(res.body.user.password).toBeUndefined();
    expect(
      (await User.findOne({ email: "c@example.com" })).isEmailVerified,
    ).toBe(true);
  });

  test("an OTP cannot be reused", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "D", email: "d@example.com", password: "pw" });
    const otp = await latestOTP("d@example.com", "email-verify");
    await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "d@example.com", otp })
      .expect(200);
    await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "d@example.com", otp })
      .expect(400);
  });

  test("OTP documents expire after 10 minutes (TTL index)", async () => {
    const doc = await OTP.create({
      email: "e@x.com",
      otp: "123456",
      type: "email-verify",
    });
    const ttlMs = doc.expiresAt - Date.now();
    expect(ttlMs).toBeGreaterThan(9.9 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(10 * 60 * 1000);
    const indexes = await OTP.collection.indexes();
    expect(
      indexes.some((i) => i.key.expiresAt === 1 && i.expireAfterSeconds === 0),
    ).toBe(true);
  });

  test("resend-otp replaces the previous OTP and 404s for unknown users", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "F", email: "f@example.com", password: "pw" });
    await request(app)
      .post("/api/auth/resend-otp")
      .send({ email: "f@example.com", type: "email-verify" })
      .expect(200);
    expect(
      await OTP.countDocuments({
        email: "f@example.com",
        type: "email-verify",
      }),
    ).toBe(1);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(2);

    await request(app)
      .post("/api/auth/resend-otp")
      .send({ email: "nobody@example.com", type: "email-verify" })
      .expect(404);
  });
});

describe("Login", () => {
  test("valid credentials return token + user", async () => {
    await createUser("g@example.com", "Secret1");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "g@example.com", password: "Secret1" })
      .expect(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("g@example.com");
  });

  test("wrong password and unknown email give the same generic error", async () => {
    await createUser("h@example.com", "Secret1");
    const a = await request(app)
      .post("/api/auth/login")
      .send({ email: "h@example.com", password: "nope" })
      .expect(400);
    const b = await request(app)
      .post("/api/auth/login")
      .send({ email: "zz@example.com", password: "nope" })
      .expect(400);
    expect(a.body.message).toBe("Invalid credentials");
    expect(b.body.message).toBe("Invalid credentials");
  });

  test("unverified user gets 403 and a fresh OTP", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "I", email: "i@example.com", password: "pw" });
    jest.clearAllMocks();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "i@example.com", password: "pw" })
      .expect(403);
    expect(res.body.needsVerification).toBe(true);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});

describe("Auth middleware", () => {
  test("protected route without token -> 401", async () => {
    const res = await request(app).get("/api/expenses").expect(401);
    expect(res.body.message).toBe("No token, access denied");
  });

  test("tampered / foreign-signed token -> 401", async () => {
    const bad = jwt.sign({ id: "x" }, "some-other-secret");
    await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${bad}`)
      .expect(401);
    await request(app)
      .get("/api/expenses")
      .set("Authorization", "Bearer garbage")
      .expect(401);
  });

  test("expired token -> 401", async () => {
    const expired = jwt.sign({ id: "x" }, process.env.JWT_SECRET, {
      expiresIn: -10,
    });
    await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${expired}`)
      .expect(401);
  });
});

describe("Forgot / reset password", () => {
  test("full OTP reset flow lets user log in with the new password", async () => {
    await createUser("j@example.com", "OldPass1");
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "j@example.com" })
      .expect(200);
    expect(emailService.sendForgotPasswordEmail).toHaveBeenCalled();

    const otp = await latestOTP("j@example.com", "forgot-password");
    await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: "j@example.com",
        otp: "000000" === otp ? "999999" : "000000",
        newPassword: "x",
      })
      .expect(400);
    await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "j@example.com", otp, newPassword: "NewPass1" })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "j@example.com", password: "OldPass1" })
      .expect(400);
    await request(app)
      .post("/api/auth/login")
      .send({ email: "j@example.com", password: "NewPass1" })
      .expect(200);
  });

  test("forgot-password for unknown email -> 404", async () => {
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@example.com" })
      .expect(404);
  });
});

describe("Change password (logged in, OTP + current password)", () => {
  test("requires correct current password and OTP", async () => {
    const { token } = await createUser("k@example.com", "Current1");
    const api = authed(token);

    await api.post("/api/auth/send-change-password-otp").expect(200);
    expect(emailService.sendChangePasswordEmail).toHaveBeenCalledWith(
      "k@example.com",
      expect.stringMatching(/^\d{6}$/),
    );
    const otp = await latestOTP("k@example.com", "change-password");

    await api
      .post("/api/auth/change-password")
      .send({ currentPassword: "wrong", otp, newPassword: "N" })
      .expect(400);
    await api
      .post("/api/auth/change-password")
      .send({ currentPassword: "Current1", otp: "bad", newPassword: "N" })
      .expect(400);
    await api
      .post("/api/auth/change-password")
      .send({ currentPassword: "Current1", otp, newPassword: "Changed1" })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "k@example.com", password: "Changed1" })
      .expect(200);
  });
});

describe("Delete account", () => {
  test("wrong password keeps everything; correct password cascades across collections", async () => {
    const alice = await createUser("alice@example.com", "Pw123456");
    const bob = await createUser("bob@example.com", "Pw123456", "Bob");
    const a = authed(alice.token);
    const b = authed(bob.token);

    await a
      .post("/api/expenses")
      .send({ title: "Lunch", amount: 200, type: "expense", category: "Food" });
    await a.post("/api/income").send({ title: "Salary", amount: 50000 });
    await a.post("/api/saving").send({ title: "FD", amount: 10000 });
    await a
      .post("/api/budget")
      .send({ category: "Food", limit: 5000, month: "Oct 2026" });
    await a
      .post("/api/goals")
      .send({ title: "Trip", targetAmount: 1000, deadline: "2027-01-01" });
    await a.post("/api/emi").send({
      name: "Car",
      totalAmount: 1000,
      emiAmount: 100,
      tenureMonths: 10,
      startDate: "2026-01-01",
    });
    await a.post("/api/bills").send({ name: "Wifi", amount: 999, dueDate: 5 });
    await a
      .post("/api/networth")
      .send({ name: "House", value: 100, type: "asset" });
    await b
      .post("/api/expenses")
      .send({ title: "Bob's", amount: 1, type: "expense" });

    await a
      .delete("/api/auth/delete-account")
      .send({ password: "wrong" })
      .expect(400);
    expect(await Expense.countDocuments({ userId: alice.user.id })).toBe(1);

    await a
      .delete("/api/auth/delete-account")
      .send({ password: "Pw123456" })
      .expect(200);

    expect(await User.findById(alice.user.id)).toBeNull();
    const mongoose = require("mongoose");
    for (const name of [
      "Expense",
      "Income",
      "Saving",
      "Budget",
      "Goal",
      "EMI",
      "Bill",
      "NetWorth",
    ]) {
      expect(
        await mongoose.model(name).countDocuments({ userId: alice.user.id }),
      ).toBe(0);
    }
    // Other users are untouched
    expect(await Expense.countDocuments({ userId: bob.user.id })).toBe(1);
    expect(await Income.countDocuments()).toBe(0);
    expect(await Saving.countDocuments()).toBe(0);
  });
});
