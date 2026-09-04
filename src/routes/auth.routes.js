import { Router } from "express";
import { register, login, logout, refreshAccessToken } from "../controllers/auth.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

import { passwordResetLimiter } from "../middlewares/rateLimiter.middleware.js";
import { forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { forgotPassword, verifyResetOtp, resetPassword } from "../controllers/auth.controller.js";


const router = Router();

router.route("/register").post(
  authLimiter,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validate(registerSchema),
  register
);

router.route("/login").post(authLimiter,validate(loginSchema), login);

router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/forgot-password").post(passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.route("/verify-reset-otp").post(passwordResetLimiter, validate(verifyOtpSchema), verifyResetOtp);
router.route("/reset-password").post(passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

export default router;