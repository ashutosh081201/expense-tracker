const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const OTP = require("../models/OTP");

let mongod;

// Spin up an isolated in-memory MongoDB per test file and wipe
// every collection between tests so each test starts clean.
const setupDB = () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
};

// Freeze "today" for date-dependent logic (bill status, EMI due
// dates, stats windows) while leaving real timers alone so the
// MongoDB driver keeps working.
const freezeDate = (isoString) => {
  jest.useFakeTimers({
    now: new Date(isoString),
    doNotFake: [
      "hrtime",
      "nextTick",
      "performance",
      "queueMicrotask",
      "setImmediate",
      "clearImmediate",
      "setInterval",
      "clearInterval",
      "setTimeout",
      "clearTimeout",
    ],
  });
};

const latestOTP = async (email, type) => {
  const rec = await OTP.findOne({ email, type, used: false });
  return rec && rec.otp;
};

// Register + verify through the real API and return a JWT.
const createUser = async (
  email = "alice@example.com",
  password = "Secret123",
  name = "Alice",
) => {
  await request(app)
    .post("/api/auth/register")
    .send({ name, email, password })
    .expect(201);
  const otp = await latestOTP(email, "email-verify");
  const res = await request(app)
    .post("/api/auth/verify-email")
    .send({ email, otp })
    .expect(200);
  return { token: res.body.token, user: res.body.user, email, password };
};

// supertest agent pre-loaded with a Bearer token
const authed = (token) => {
  const wrap = (method) => (url) =>
    request(app)[method](url).set("Authorization", `Bearer ${token}`);
  return {
    get: wrap("get"),
    post: wrap("post"),
    put: wrap("put"),
    delete: wrap("delete"),
  };
};

module.exports = { app, setupDB, freezeDate, latestOTP, createUser, authed };
