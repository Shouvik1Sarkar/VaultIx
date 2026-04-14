import request, { cookies } from "supertest";
import mongoose from "mongoose";
import { MONGODB_TEST_URL } from "../config/env.config.js";
import { jest } from "@jest/globals";
import { db } from "../connect/db.connect.js";
import crypto from "crypto";
import User from "../src/models/user.models.js";

await jest.unstable_mockModule("../src/utils/email.utils.js", () => ({
  mail: jest.fn().mockResolvedValue(true),
}));

const { default: app } = await import("../src/app.js");

// ─── Helper ───────────────────────────────────────────────
async function registerUser() {
  await request(app).post("/v1/api/auth/signUp").send({
    firstName: "test",
    lastName: "lastTest",
    userName: "test-1",
    email: "test@example.com",
    password: "Aa$123456",
  });
}

async function verifyUserEmail() {
  const otp = 123456;
  const encryptedOTP = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");

  await User.findOneAndUpdate(
    { email: "test@example.com" },
    {
      emailVerificationToken: encryptedOTP,
      emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
    },
  );

  await request(app)
    .post("/v1/api/auth/emailVerification")
    .send({ token: otp });
}

async function registerAndVerifyUser() {
  await registerUser();
  await verifyUserEmail();
}

async function logInUser() {
  await registerAndVerifyUser();
  const res = await request(app).post("/v1/api/auth/logInUser").send({
    email: "test@example.com",
    password: "Aa$123456",
  });
  return res.headers["set-cookie"]; // ← return cookies
}
async function logInUser2() {
  await registerAndVerifyUser();
  const res = await request(app).post("/v1/api/auth/logInUser").send({
    email: "test@example.com",
    password: "Bb$123456",
  });
  return res.headers["set-cookie"]; // ← return cookies
}

beforeAll(async () => {
  //   await mongoose.connect(MONGODB_URL);
  // console.log("CONNECTING");
  await db(MONGODB_TEST_URL);
  // console.log("-----CONNECTED------");
}, 15000);

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  await mongoose.disconnect();
}, 15000);

describe("Book Mark Apis", () => {
  test("Should hit a random testing controller.", async () => {
    const res = await request(app).get("/v1/api/bookMark/bookMarkRandoms");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("HELLO this is test");
  }, 15000);

  test("Save the url", async () => {
    const cookies = await logInUser();

    const res = await request(app)
      .post("/v1/api/bookMark/")
      .send({ url: "https://www.youtube.com/watch?v=3dTh0rxE4NU" })
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("book marked");
  }, 15000);
  test("all the saved urls", async () => {
    const cookies = await logInUser();

    const res = await request(app)
      .get("/v1/api/bookMark/all_the_saved_urls")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("All URLs");
  }, 15000);
  test("all the saved urls", async () => {
    const cookies = await logInUser();

    const res = await request(app)
      .post("/v1/api/bookMark/")
      .send({ url: "https://www.facebook.com/reel/1987750689288089" })
      .set("Cookie", cookies);

    // console.log("RES:", res.body.data._id);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("book marked");
  }, 15000);
});
