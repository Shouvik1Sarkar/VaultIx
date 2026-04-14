import { body } from "express-validator";
import ApiError from "./ApiError.utils.js";

export function registerValidator() {
  return [
    body("firstName").trim().notEmpty().withMessage("First name is required"),

    body("lastName").trim().notEmpty().withMessage("Last name is required"),

    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 6 })
      .withMessage("Username must be at least 6 characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email")
      .normalizeEmail(),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one symbol"),
  ];
}
export function logInValidator() {
  return [
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email")
      .normalizeEmail(),

    body("userName")
      .optional()
      .trim()
      .isLength({ min: 6 })
      .withMessage("Username must be at least 6 characters"),

    body("password").trim().notEmpty().withMessage("Password is required"),

    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.userName) {
        throw new ApiError(400, "Either email or username is required");
      }

      return true;
    }),
  ];
}
