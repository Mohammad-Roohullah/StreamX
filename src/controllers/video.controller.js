import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import Video from "../models/video.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";

import { deleteCache, setIfNotExists  } from "../utils/redisCache.js";
import redisClient from "../db/redis.js";

const publishAVideo = asyncHandler(async (req, res) => {
   
    const { title, description } = req.body;

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadFileOnCloudinary(videoLocalPath);
    const thumbnail = await uploadFileOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video upload failed");
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration, // Cloudinary computes this for us on upload
        owner: req.user._id,
    });

    // redis delete the invalidated cache of video list
    await deleteCache(`channel:profile:${req.user.username}`);
    await deleteCache(`dashboard:stats:${req.user._id}`);

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const debounceKey = `view:debounce:${req.user._id}:${videoId}`;
    const shouldCountView = await setIfNotExists(debounceKey, 1800);

    // SET key value NX EX ttl -> atomic "set only if it doesn't already exist"
    // returns "OK" if it was set (i.e., this is a fresh view), null if it already existed

    // if Redis goes down, setIfNotExists returns true on error, meaning we skip debounce protection entirely and just increment on every view during the outage. ("fail-open" decision)

    if (shouldCountView) {
        await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
        await deleteCache(`dashboard:stats:${video.owner._id}`);
    }

    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoId },
    });

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // ownership check — only the uploader can edit their own video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;

    // optional thumbnail replacement
    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const newThumbnail = await uploadFileOnCloudinary(thumbnailLocalPath);
        if (!newThumbnail?.url) {
        throw new ApiError(400, "Error while uploading new thumbnail");
        }
        const oldThumbnailUrl = video.thumbnail;
        video.thumbnail = newThumbnail.url;
        await deleteFileFromCloudinary(oldThumbnailUrl);
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
  
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }

    await deleteFileFromCloudinary(video.videoFile);
    await deleteFileFromCloudinary(video.thumbnail);
    await video.deleteOne();

    // redis delete the invalidated cache of video list
    await deleteCache(`channel:profile:${req.user.username}`);
    await deleteCache(`dashboard:stats:${req.user._id}`);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, `Video is now ${video.isPublished ? "published" : "unpublished"}`));
});

const getAllVideos = asyncHandler(async (req, res) => {
    
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const matchStage = { isPublished: true };

    if (query) {
        matchStage.$text = { $search: query };
    }

    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortStage = {};
    if (sortBy) {
        sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        sortStage.createdAt = -1; // default: newest first
    }

    const videosAggregate = Video.aggregate([
        { $match: matchStage },
        {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
        },
        },
        { $addFields: { owner: { $first: "$owner" } } },
        { $sort: sortStage },
        {
        $project: {
            title: 1,
            thumbnail: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            owner: { username: 1, fullName: 1, avatar: 1 },
        },
        },
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videosAggregate, options);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export {
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos
};