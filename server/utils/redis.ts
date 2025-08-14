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
/*
Using Redis for cache maintenance can significantly improve performance when multiple users
are accessing the same site. By storing user data in Redis, returning users can access the site
more quickly, as their records are already available for later use. The stored sessions will 
be configured to expire after seven days, ensuring efficient memory management and up-to-date 
data.
*/