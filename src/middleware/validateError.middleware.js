import { validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";

const validate = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedError = [];

  errors.array().map((err) =>
    extractedError.push({
      [err.path]: err.msg,
    }),
  );

  // console.log("EXTRACTED ERROR: ", extractedError);

  throw new ApiError(422, "RECIEVED DATA IS NOT", extractedError);
});
export default validate;
