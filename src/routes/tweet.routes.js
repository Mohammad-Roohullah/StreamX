import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

import { validate } from "../middlewares/validate.middleware.js";
import { createTweetSchema, updateTweetSchema } from "../validators/tweet.validator.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post( validate(createTweetSchema), createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch( validate(updateTweetSchema), updateTweet).delete(deleteTweet);

export default router;