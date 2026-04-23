import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import fs from "fs";
import { uploadFile } from "../utils/cloudinary.utils.js";
import { mail } from "../utils/email.utils.js";
import crypto from "crypto";

import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { REFRESH_TOKEN_SECRET } from "../../config/env.config.js";
import jwt from "jsonwebtoken";
import redisClient from "../../config/redis.config.js";

// export const randomUser = asyncHandler(async (req, res) => {
//   return res.send("HELLO this is test");
// });

export const addOrChangeProfilePicture = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const profilePicture = req.file;

  if (!profilePicture) {
    throw new ApiError(400, "Profile picture required");
  }

  const cloudinaryPath = await uploadFile(profilePicture.path);

  const user = await User.findByIdAndUpdate(
    myUser._id,
    { profilePicture: cloudinaryPath },
    { new: true },
  );

  return res.status(200).json(new ApiResponse(200, user, "User here"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const { firstName, lastName, userName } = req.body;
  const userId = req.user._id;
  const updateData = {};

  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (userName !== undefined) updateData.userName = userName;

  // if (Object.keys(updateData).length === 0) {
  //   throw new ApiError(400, "Provide at least one field to update");
  // }

  const user = await User.findByIdAndUpdate(myUser._id, updateData, {
    new: true,
  }).select("-password");

  await redisClient.del(`user:${userId}`);
  return res.status(200).json(new ApiResponse(200, user, "User updated"));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const { oldPassword, newPassword, repeatNewPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(myUser._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const pass = await user.matchPassword(oldPassword, user.password);
  if (!pass) {
    throw new ApiError(401, "Password did not match");
  }

  const pass2 = await user.matchPassword(newPassword, user.password);
  if (pass2) {
    throw new ApiError(400, "New password must be different from old password");
  }

  if (newPassword !== repeatNewPassword) {
    throw new ApiError(400, "New passwords do not match");
  }

  user.password = newPassword;

  await user.save();
  await redisClient.del(`user:${userId}`);
  return res.status(200).json(new ApiResponse(200, null, "Password Updated"));
});

export const logOut = asyncHandler(async (req, res) => {
  const user = req.user;
  const userId = req.user._id;

  if (!user) {
    throw new ApiError(401, "User not Logged In");
  }

  await redisClient.del(`user:${userId}`);
  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, null, "Logged Out"));
});

export const forgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email, userName } = req.body;
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(400, "Wrong credentials");
  }

  const { num, encryptedOTP } = await user.generateForgotOTP();
  mail(user.email, "otp", num.toString());

  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Otp Sent"));
});

export const changeForgottenPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;

  const encryptedOTP = crypto
    .createHash("sha256")
    .update(otp.toString()) // put OTP into hash
    .digest("hex");

  // console.log("encrypted otp: ", encryptedOTP);

  const user = await User.findOne({
    forgotPasswordOtp: encryptedOTP,
    forgotPasswordOtpExpiry: { $gt: new Date() },
  });
  // console.log("USER: ", user);
  if (!user) {
    throw new ApiError(400, "Wrong OTP");
  }
  const userId = user._id;
  user.password = newPassword;
  user.forgotPasswordOtp = undefined;
  user.forgotPasswordOtpExpiry = undefined;
  await user.save();
  await redisClient.del(`user:${userId}`);
  return res.status(200).json(new ApiResponse(200, null, "Password changed."));
});

// export const userStats = asyncHandler(async (req, res) => {
//   const myUser = req.user;

//   const now = new Date();

//   const data = await Url.aggregate([
//     {
//       $match: {
//         createdBy: new mongoose.Types.ObjectId(myUser._id),
//       },
//     },
//     {
//       $group: {
//         _id: "$createdBy",
//         totalUrls: { $sum: 1 },
//         totalClicks: { $sum: "$clicks" },
//         activeUrls: { $sum: { $cond: [{ $gt: ["$expiryTime", now] }, 1, 0] } },
//         expiredUrls: {
//           $sum: { $cond: [{ $lte: ["$expiryTime", now] }, 1, 0] },
//         },
//       },
//     },
//   ]);

//   const stats = data[0];

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         totalUrls: stats?.totalUrls ?? 0,
//         totalClicks: stats?.totalClicks ?? 0,
//         activeUrls: stats?.activeUrls ?? 0,
//         expiredUrls: stats?.expiredUrls ?? 0,
//       },
//       "This is urls",
//     ),
//   );
// });

/* ***** Get User's own Profile ***** */

// with redis

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(401, "User not Logged In.");
  }

  const cachedKey = `user:${userId}`;
  const cachedUser = await redisClient.get(cachedKey);

  if (cachedUser) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedUser), "get user"));
  }

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const cleanUser = user.toObject();

  await redisClient.setEx(cachedKey, 60, JSON.stringify(cleanUser));
  return res.status(200).json(new ApiResponse(200, cleanUser, "get user"));
});

// without redis
// export const getMe = asyncHandler(async (req, res) => {
//   const myUser = req.user;
//   const userId = req.user._id;
//   // cache key
//   const cacheKey = `user:${userId}`;
//   if (!myUser) {
//     throw new ApiError(401, "Not loggedIn.");
//   }
//   const user = await User.findById(myUser._id);
//   if (!user) {
//     throw new ApiError(404, "user not found.");
//   }
//   return res.status(200).json(new ApiResponse(200, user, "user"));
// });

export const refreshToken = asyncHandler(async (req, res) => {
  const refresh = req.cookies.refreshToken;

  if (!refresh) {
    throw new ApiError(401, "No refresh token");
  }

  let decoded;
  try {
    decoded = jwt.verify(refresh, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const encryptedRefreshToken = crypto
    .createHash("sha256")
    .update(refresh.toString())
    .digest("hex");

  const user = await User.findOne({
    _id: decoded._id,
    refreshToken: encryptedRefreshToken.toString(),
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = await user.setAccessToken(user._id);

  if (!accessToken) {
    throw new ApiError(500, "Failed to generate access token");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json(new ApiResponse(200, null, "Access Token set"));
});

/**
 * number of urls
 * total clicks
 * active urls
 * expired urls
 * **clicks in last 30 days
 *
 */
