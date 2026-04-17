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

describe("User API", () => {
  test("get my profile", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    const res = await request(app)
      .get("/v1/api/user/getMe")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("user");
  }, 15000);
  test("Log Out my profile", async () => {
    const cookies = await logInUser();
    const res = await request(app)
      .get("/v1/api/user/logOut")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged Out");
  }, 15000);
  test("Update Password.", async () => {
    const cookies = await logInUser();
    // console.log("XXXXXXXXXXXXXXXXXXXXXX");
    const res = await request(app)
      .post("/v1/api/user/updatePassword")
      .set("Cookie", cookies)
      .send({
        oldPassword: "Aa$123456",
        newPassword: "Bb$123456",
        repeatNewPassword: "Bb$123456",
      });

    // console.log("response body", res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Password Updated");
  }, 15000);
  test("Foegotten password OTP", async () => {
    const cookies = await logInUser2();

    // console.log("COOKIES-------, ", cookies);

    const otp = 123456;
    const encryptedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const updated = await User.findOneAndUpdate(
      { email: "test@example.com" },
      {
        forgotPasswordOtp: encryptedOTP,
        forgotPasswordOtpExpiry: Date.now() + 5 * 60 * 1000,
      },
    );
    // console.log("User found:", updated?.email);

    const res = await request(app)
      .post("/v1/api/user/changeForgottenPassword")
      .set("Cookie", cookies)
      .send({ otp: otp, newPassword: "Bb$123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Password changed.");
  }, 15000);
  test("refresh token", async () => {
    const cookies = await logInUser2();
    // console.log("COOKEIS: ", cookies);
    const res = await request(app)
      .get("/v1/api/user/refreshToken")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Access Token set");
  }, 15000);
});
