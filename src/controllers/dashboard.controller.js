import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Video from "../models/video.model.js";
import Subscription from "../models/subscription.model.js";
import Like from "../models/like.model.js";

import { getCache, setCache } from "../utils/redisCache.js";

const getChannelStats = asyncHandler(async (req, res) => {
    
    const channelId = req.user._id;
    
    // redis cache
    const cacheKey = `dashboard:stats:${channelId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
        return res.status(200).json(new ApiResponse(200, cached, "Channel stats fetched successfully (cached through redis)"));
    }

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        {
        $group: {
            _id: null,
            totalVideos: { $sum: 1 },
            totalViews: { $sum: "$views" },
        },
        },
    ]);

    // count likes across all of this user's videos
    const totalLikes = await Like.aggregate([
        {
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
        },
        },
        { $unwind: "$video" },
        { $match: { "video.owner": new mongoose.Types.ObjectId(channelId) } },
        { $count: "totalLikes" },
    ]);

    const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0,
    };

    await setCache(cacheKey, stats, 60); // redis cached for 1 minute

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    
    const channelId = req.user._id;

    const videos = await Video.find({ owner: channelId }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };