import { aj } from "../../config/arcjet.config.js";
import ApiError from "../utils/ApiError.utils.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    // Request 1 token per request (not 5!)
    const decision = await aj.protect(req, { requested: 1 });
    // console.log("DECISION: ", decision);
    // console.log("Arcjet Decision:", {
    //   ip: req.ip,
    //   conclusion: decision.conclusion,
    //   reason: decision.reason,
    // });
    // console.log("xxxxxxxxxxxxxxxxx", decision.isDenied());
    // console.log("xxxxxxxxxxxxxxxxx", decision.reason);
    if (decision.isDenied()) {
      // console.log(
      //   "decision.reason.isRateLimit()",
      //   decision.reason.isRateLimit(),
      // );
      if (decision.reason.isRateLimit()) {
        throw new ApiError(429, "Too many requests. Try again later.");
      }
      if (decision.reason.isBot()) {
        throw new ApiError(403, "Bot detected");
      }
      throw new ApiError(403, "Access denied");
    }

    next();
  } catch (error) {
    console.error("ARCJET ERROR:", error);

    // CRITICAL: Always call next, even on error
    // In production, you might want to fail open (allow request) or fail closed (block)
    // Fail open = better UX, fail closed = more secure

    if (error instanceof ApiError) {
      throw error; // Let global error handler deal with it
      // throw new ApiError(400, "error archjet", error); // Let global error handler deal with it
    }

    // throw new ApiError(500, "rate limiter error", error);

    // If Arcjet itself is broken, decide: allow or block?
    // Option 1: Fail open (allow request)
    next();

    // Option 2: Fail closed (block request) - more secure
    // throw new ApiError(500, "Security check failed");
  }
};

export default arcjetMiddleware;
