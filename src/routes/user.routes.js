import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";

const router = Router();
router.use(verifyJWT); // every route in this file requires login — it's all "manage my own profile"

router.route("/me").get(getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router.route("/change-password").patch(changeCurrentPassword);
router.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(upload.single("coverImage"), updateUserCoverImage);

export default router;