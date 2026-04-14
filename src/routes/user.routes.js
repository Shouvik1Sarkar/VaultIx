// getMe;
import { Router } from "express";

import {
  addOrChangeProfilePicture,
  changeForgottenPassword,
  forgotPasswordOtp,
  getMe,
  logOut,
  randomUser,
  refreshToken,
  updatePassword,
  updateProfile,
} from "../controllers/user.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const userRoutes = Router();

userRoutes.get("/getMe", logInAuth, getMe);
userRoutes.get("/randomUser", randomUser);

userRoutes.post(
  "/addOrChangeProfilePicture",
  logInAuth,
  upload.single("profilePicture"),
  addOrChangeProfilePicture,
);

userRoutes.post("/updateProfile", logInAuth, updateProfile);
userRoutes.post("/updatePassword", logInAuth, updatePassword);
userRoutes.get("/logOut", logInAuth, logOut);
userRoutes.post("/forgotPasswordOtp", logInAuth, forgotPasswordOtp);
userRoutes.post("/changeForgottenPassword", logInAuth, changeForgottenPassword);
userRoutes.get("/refreshToken", logInAuth, refreshToken);

export default userRoutes;
