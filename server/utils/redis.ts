import Redis from "ioredis";
require("dotenv").config();

// Create a Redis client
const redisClient = ()=>{
if (process.env.REDIS_URL) {
console.log("Connecting to Redis...");
return process.env.REDIS_URL;
}
throw new Error("REDIS connection fail");
}

export const redis = new Redis(redisClient());