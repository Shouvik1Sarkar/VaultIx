import cookieParser from "cookie-parser";

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env.config.js";
import ApiError from "../utils/ApiError.utils.js";
import User from "../models/user.models.js";

export async function logInAuth(req, res, next) {
  const accessId = req.cookies.accessToken;

  // console.log("accessis: ", accessId);

  if (!accessId) {
    throw new ApiError(401, "Not loggedIn cookie not here");
    // return next();
  }

  const decodedData = await jwt.verify(accessId, JWT_SECRET);
  // console.log("decoded data", decodedData);
  const user = await User.findById(decodedData._id);

  if (!user) {
    throw new ApiError(404, "Cookie sessioned out");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(401, "Email not verified");
  }

  req.user = decodedData;

  return next();
}
