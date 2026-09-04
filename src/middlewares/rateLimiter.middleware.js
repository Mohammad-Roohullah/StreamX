import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../db/redis.js";
import { ApiError } from "../utils/ApiError.js";

// Create me a Redis storage system for rate limiting, connected to my Redis server, and organize its keys using the prefix I give you.
// express rate limit now store data in redis so that if there are many servers, they can share the same redis server
const redisStoreFactory = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix,
  });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStoreFactory("rl:auth:"),
  handler: (req, res, next) => next(new ApiError(429, "Too many attempts, please try again later")),
  // What should happen when the user exceeds the limit?
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStoreFactory("rl:api:"),
  handler: (req, res, next) => next(new ApiError(429, "Too many requests, please try again later")),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // tight — this endpoint is a prime abuse target
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStoreFactory("rl:reset:"),
  handler: (req, res, next) => next(new ApiError(429, "Too many reset attempts, please try again later")),
});

export { authLimiter, apiLimiter, passwordResetLimiter };