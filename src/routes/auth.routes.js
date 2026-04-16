import { Router } from "express";

import {
  signUp,
  emailVerification,
  sendEmailVerificationOTP,
  logInUser,
  random,
} from "../controllers/auth.controllers.js";
import { logInValidator, registerValidator } from "../utils/validate.utils.js";
import validate from "../middleware/validateError.middleware.js";

const authRoutes = Router();

authRoutes.get("/random", random); // test controller
authRoutes.post("/signUp", registerValidator(), validate, signUp); // Create User (send OTP)
authRoutes.post("/sendEmailVerificationOTP", sendEmailVerificationOTP); // Send OTP (In case you did not complete the process before while Signing Up)
authRoutes.post("/emailVerification", emailVerification); // Enter OTP to verify Email
authRoutes.post("/logInUser", logInValidator(), validate, logInUser); // Enter OTP to verify Email

export default authRoutes;
