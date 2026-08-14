import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP (15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many attempts, please try again later"));
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // generous general limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many requests, please try again later"));
  },
});

export { authLimiter, apiLimiter };