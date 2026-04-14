import request from "supertest";
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

describe("Auth API", () => {
  test("Should hit a random testing controller.", async () => {
    const res = await request(app).get("/v1/api/auth/random");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("HELLO this is test");
  }, 15000);

  it("should register a user", async () => {
    const res = await request(app).post("/v1/api/auth/signUp").send({
      firstName: "test",
      lastName: "lastTest",
      userName: "test-1",
      email: "test@example.com",
      password: "Aa$123456",
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("email", "test@example.com");
  }, 15000);

  it("should verify email", async () => {
    // 1️⃣ Register
    await request(app).post("/v1/api/auth/signUp").send(
      {
        firstName: "test",
        lastName: "lastTest",
        userName: "test-1",
        email: "test@example.com",
        password: "Aa$123456",
      },
      { new: true },
    );

    // 2️⃣ Find user and overwrite the OTP with a known one
    const otp = 123456;
    const encryptedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const updated = await User.findOneAndUpdate(
      { email: "test@example.com" },
      {
        emailVerificationToken: encryptedOTP,
        emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
      },
    );
    // console.log("User found:", updated?.email);
    // console.log("Token in DB:", updated?.emailVerificationToken);
    // console.log("Sending OTP:", otp);
    // console.log("Hashed OTP:", encryptedOTP);
    // console.log("User found and updated");
    // 3️⃣ Verify with the known raw OTP
    const res = await request(app)
      .post("/v1/api/auth/emailVerification") // adjust route
      .send({ token: otp });

    //   console.log("Token in DBlll:", res);
    // console.log("otp sendt");
    // console.log("is email verified:", updated?.isEmailVerified);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified");
  }, 15000);

  it("should LogIn User", async () => {
    // 1️⃣ Register
    await request(app).post("/v1/api/auth/signUp").send(
      {
        firstName: "test",
        lastName: "lastTest",
        userName: "test-1",
        email: "test@example.com",
        password: "Aa$123456",
      },
      { new: true },
    );

    // 2️⃣ Find user and overwrite the OTP with a known one
    const otp = 123456;
    const encryptedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const updated = await User.findOneAndUpdate(
      { email: "test@example.com" },
      {
        emailVerificationToken: encryptedOTP,
        emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
      },
    );
    // console.log("User found:", updated?.email);
    // console.log("Token in DB:", updated?.emailVerificationToken);
    // console.log("Sending OTP:", otp);
    // console.log("Hashed OTP:", encryptedOTP);
    // console.log("User found and updated");
    // 3️⃣ Verify with the known raw OTP
    const res = await request(app)
      .post("/v1/api/auth/emailVerification") // adjust route
      .send({ token: otp });

    //   console.log("Token in DBlll:", res);
    // console.log("otp sendt");
    // console.log("is email verified:", updated?.isEmailVerified);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified");

    const loggedInUser = await request(app)
      .post("/v1/api/auth/logInUser")
      .send({
        email: "test@example.com",
        password: "Aa$123456",
      });

    expect(loggedInUser.status).toBe(200);
    expect(loggedInUser.body.message).toBe("User Logged In");

    // data checks
    expect(loggedInUser.body.data.userResult).toHaveProperty(
      "email",
      "test@example.com",
    );
  }, 15000);
});
