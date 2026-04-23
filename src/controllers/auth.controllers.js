import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";

import crypto from "crypto";

import { mail } from "../utils/email.utils.js";
import Folder from "../models/folders.models.js";
// import { uploadFile } from "../utils/cloudinary.utils.js";

async function createFolders(userId) {
  const defaultFolders = [
    "all",
    "read Later",
    "articles",
    "videos",
    "work",
    "personal",
    "post",
  ];

  const folders = await Folder.insertMany(
    defaultFolders.map((folderName) => ({ folderName, createdBy: userId })),
  );

  return folders;

  //   const value = [];

  //   for (let i = 0; i < defaultFolders.length; i++) {
  //     const folder = await Folder.create({
  //       folderName: defaultFolders[i],
  //       createdBy: userId,
  //     });
  //     value.push(folder);
  //   }
  //   console.log("VALUE FOLDERS: ", value);
  //   return value;
}

// export const random = asyncHandler(async (req, res) => {
//   return res.send("HELLO this is test");
// });

export const signUp = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, userName, password, email } = req.body;

  if (
    [firstName, lastName, userName, password, email].some(
      (e) => e == undefined || e.trim() == "",
    )
  ) {
    throw new ApiError(400, "All credentials are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists. Log in.");
  }

  const user = await User.create({
    firstName,
    lastName,
    userName,
    password,
    email,
  });

  if (!user) {
    throw new ApiError(500, "User not created");
  }

  const { num, encryptedOTP } = user.generateOTP();

  await mail(user.email, "subject", num.toString());

  const folders = await createFolders(user._id);
  user.folders = folders;
  await user.save();

  const safeUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken",
  );

  return res.status(201).json(new ApiResponse(201, safeUser, "User created"));
});

export const sendEmailVerificationOTP = asyncHandler(async (req, res) => {
  const { email, userName } = req.body;

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const { num, encryptedOTP } = user.generateOTP();

  mail(user.email, "subject", num.toString());

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, null, "OTP Sent"));
});

export const emailVerification = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "No token");
  }

  const otp = crypto
    .createHash("sha256")
    .update(token.toString())
    .digest("hex");

  const user = await User.findOne({
    $and: [
      { emailVerificationToken: otp },
      { emailVerificationTokenExpiry: { $gt: Date.now() } },
    ],
  });

  if (!user) {
    throw new ApiError(404, "Invalid OTP");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, null, "Email verified"));
});

export const logInUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  const findUser = await User.findOne({
    $or: [{ email }, { userName }],
  }).select("-emailVerificationToken -forgotPasswordOtp");

  if (!findUser) {
    throw new ApiError(404, "User does not exist");
  }

  if (!findUser.isEmailVerified) {
    throw new ApiError(403, "Email not verified");
  }

  const loggedInUser = await findUser.matchPassword(password);

  if (!loggedInUser) {
    throw new ApiError(401, "Wrong password");
  }

  const accessToken = await findUser.setAccessToken(findUser._id);
  const refreshToken = await findUser.setRefreshToken(findUser._id);

  const encryptedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken.toString())
    .digest("hex");

  await User.findByIdAndUpdate(findUser._id, {
    refreshToken: encryptedRefreshToken,
  });

  const userResult = await User.findById(findUser._id).select(
    "-password -refreshToken -emailVerificationToken -forgotPasswordOtp",
  );

  const folders = await Folder.find({
    createdBy: userResult._id,
    isDeleted: false,
  }).sort({ folderName: 1 });

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json(new ApiResponse(200, { userResult, folders }, "User logged in"));
});

export const test = asyncHandler(async (req, res) => {
  return res.send("Hello");
});
