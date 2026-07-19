import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Comment from "../models/comment.model.js";
import Video from "../models/video.model.js";

const addComment = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const commentsAggregate = Comment.aggregate([
        // stage 1: filter to only this video's comments
        {
        $match: {
            video: new mongoose.Types.ObjectId(videoId),
        },
        },
        // stage 2: join owner details from the User collection
        {
        $lookup: {
            from: "users",          // actual MongoDB collection name (lowercase, pluralized by Mongoose)
            localField: "owner",
            foreignField: "_id",
            as: "owner",
        },
        },
        // stage 3: join likes for each comment from the Like collection
        {
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes",
        },
        },
        // stage 4: compute derived fields
        {
        $addFields: {
            likesCount: { $size: "$likes" },
            owner: { $first: "$owner" }, // $lookup always returns an array — we know there's exactly one owner
            isLiked: {
            $cond: {
                if: { $in: [req.user?._id, "$likes.likedBy"] },
                then: true,
                else: false,
            },
            },
        },
        },
        // stage 5: sort newest first
        {
        $sort: { createdAt: -1 },
        },
        // stage 6: shape the final output — only send what the frontend needs
        {
        $project: {
            content: 1,
            createdAt: 1,
            likesCount: 1,
            isLiked: 1,
            owner: {
            username: 1,
            fullName: 1,
            avatar: 1,
            },
        },
        },
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(commentsAggregate, options);

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this comment");
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { addComment, getVideoComments, updateComment, deleteComment };