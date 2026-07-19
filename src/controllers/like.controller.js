import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Like from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;

    const existingLike = await Like.findOne({ video: videoId, likedBy: req.user._id });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Video unliked"));
    }

    await Like.create({ video: videoId, likedBy: req.user._id });
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
   
    const { commentId } = req.params;

    const existingLike = await Like.findOne({ comment: commentId, likedBy: req.user._id });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Comment unliked"));
    }

    await Like.create({ comment: commentId, likedBy: req.user._id });
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Comment liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params;

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Tweet unliked"));
    }

    await Like.create({ tweet: tweetId, likedBy: req.user._id });
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
   
    const likedVideos = await Like.find({ likedBy: req.user._id, video: { $ne: null } })
        .populate({
        path: "video",
        populate: { path: "owner", select: "username fullName avatar" }, // nested populate
        });

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };