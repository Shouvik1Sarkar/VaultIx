import { createClient } from "redis";
import { REDIS_URL } from "./env.config.js";

const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("REDIS ERROR: ", err);
});
await redisClient.connect();
console.log("REDIS CONNECTED");

export default redisClient;
