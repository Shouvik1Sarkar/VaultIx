import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  JWT_EXPIRES_IN,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRES,
  REFRESH_TOKEN_SECRET,
} from "../../config/env.config.js";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpiry: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordOtp: {
      type: String,
    },
    forgotPasswordOtpExpiry: {
      type: Date,
    },
    // folders: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Folder",
    //   },
    // ],
  },
  { timestamps: true },
);

// userSchema.index({ userName: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.matchPassword = async function (userPassword) {
  const isMatch = await bcrypt.compare(userPassword, this.password);
  // console.log("---", isMatch);
  return isMatch;
};

const options = {};

userSchema.methods.setAccessToken = async function (id) {
  const jwt_secret = jwt.sign({ _id: id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return jwt_secret;
};
userSchema.methods.setRefreshToken = async function (id) {
  const jwt_secret = jwt.sign({ _id: id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
  // console.log("JWT: ", jwt_secret);
  return jwt_secret;
};

userSchema.methods.generateOTP = function () {
  const num = Math.floor(100000 + Math.random() * 900000);

  const encryptedOTP = crypto
    .createHash("sha256")
    .update(num.toString()) // put OTP into hash
    .digest("hex");

  this.emailVerificationToken = encryptedOTP;
  this.emailVerificationTokenExpiry = Date.now() + 5 * 60 * 1000;
  // console.log(num);
  // console.log(encryptedOTP);
  return { num, encryptedOTP };
};

userSchema.methods.matchOTP = function (otp) {
  const isMatch = crypto
    .createHash("sha256")
    .update(otp.toString()) // put OTP into hash
    .digest("hex");

  // if () {

  // }

  return isMatch == this.emailVerificationToken;
};

userSchema.methods.generateForgotOTP = function () {
  // const num = Math.floor(100000 + Math.random() * 900000);
  const num = crypto.randomInt(100000, 999999);

  const encryptedOTP = crypto
    .createHash("sha256")
    .update(num.toString()) // put OTP into hash
    .digest("hex");

  this.forgotPasswordOtp = encryptedOTP;
  this.forgotPasswordOtpExpiry = Date.now() + 5 * 60 * 1000;
  // console.log(num);
  // console.log(encryptedOTP);
  return { num, encryptedOTP };
};

const User = mongoose.model("User", userSchema);

export default User;
