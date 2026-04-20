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
  console.log("Starting cleanup...");

  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }

  // Disconnect mongoose
  await mongoose.disconnect();

  // ✅ DISCONNECT REDIS using the helper
  try {
    const { disconnectRedis } = await import("../config/redis.config.js");
    if (disconnectRedis) {
      await disconnectRedis();
      console.log("REDIS DISCONNECTED");
    }
  } catch (error) {
    console.log("Redis disconnect error:", error.message);
  }

  // Clear all timers and mocks
  jest.clearAllTimers();
  jest.clearAllMocks();

  if (global.server) {
    await new Promise((resolve) => global.server.close(resolve));
  }

  console.log("Cleanup complete");
}, 30000);

describe("Book Mark Apis", () => {
  test("Create Folder.", async () => {
    const cookies = await logInUser();
    const res = await request(app)
      .post("/v1/api/folder/createFolder")
      .send({ folderName: "test_folder" })
      .set("Cookie", cookies);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("This is it");
  }, 15000);
  test("rename folder", async () => {
    const cookies = await logInUser();
    const folder = await request(app)
      .post("/v1/api/folder/createFolder")
      .send({ folderName: "test_folder12" })
      .set("Cookie", cookies);

    console.log(
      "*****************************FOLDER***************************",
      folder,
    );
    const res = await request(app)
      .patch(`/v1/api/folder/renameFolder/${folder.body.data._id}`)
      .send({ name: "changed name" })
      .set("Cookie", cookies);

    console.log(
      "*****************************RES***************************",
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Folder renamed");
  }, 15000);
  // test("delete folder", async () => {
  //   const cookies = await logInUser();

  //   // console.log("COOKIES:======", cookies);
  //   const folder = await request(app)
  //     .post("/v1/api/folder/createFolder")
  //     .send({ folderName: "test_folder123" })
  //     .set("Cookie", cookies);

  //   const res = await request(app)
  //     .post(`/v1/api/folder/deleteFolder/${folder.body.data._id}`)
  //     .set("Cookie", cookies);

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.message).toBe("Folder deleted");
  // }, 15000);
  // test(" allFolders", async () => {
  //   const cookies = await logInUser();

  //   // console.log("COOKIES:======", cookies);
  //   // const folder = await request(app)
  //   //   .post("/v1/api/folder/createFolder")
  //   //   .send({ folderName: "test_folder123" })
  //   //   .set("Cookie", cookies);

  //   const res = await request(app)
  //     .post(`/v1/api/folder/allFolders`)
  //     .set("Cookie", cookies);

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.message).toBe("FOLDERS");
  // }, 15000);
});
