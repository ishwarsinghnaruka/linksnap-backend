import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Render/Railway provides REDIS_URL
const redisUrl = process.env.REDIS_URL;

const redisClient = redisUrl
  ? createClient({ url: redisUrl })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    });

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error("❌ Failed to connect to Redis:", err);
});

export default redisClient;
