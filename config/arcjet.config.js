import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY } from "./env.config.js";

// Create an Arcjet instance with multiple rules
export const aj = arcjet({
  key: ARCJET_KEY, // Get your site key from https://app.arcjet.com
  characteristics: ["ip.src"],
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),

    tokenBucket({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only

      capacity: 5,
      refillRate: 5,
      interval: 60, // 1 token every 12 sec = 5/min

      // refillRate: 10, // refill 5 tokens per interval
      // interval: 60, // refill every 10 seconds
      // capacity: 10, // bucket maximum capacity of 10 tokens
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:API_CLIENT"], // "allow none" will block all detected bots
    }),
  ],
});
