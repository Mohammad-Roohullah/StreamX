import { Router } from "express";
import { register, login, logout, refreshAccessToken } from "../controllers/auth.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

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

export default router;