import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";

import { getCache, setCache, deleteCache } from "../utils/redisCache.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    // verifyJWT already attached req.user, no DB call needed
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));  // has to change req.user bcz its sending evrything
});


const updateAccountDetails = asyncHandler(async (req, res) => {
    
    const { fullName, email } = req.body;

    if (!fullName && !email) {
      throw new ApiError(400, "At least one field (fullName or email) is required");
    }

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true } // return the updated document, not the pre-update one
    ).select("-password -refreshToken");

    // redis delete the invalidated cache
    await deleteCache(`channel:profile:${user.username}`); 

    return res.status(200).json(new ApiResponse(200, user, "Account details updated"));
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
   
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save(); // pre-save hook re-hashes since password field changed

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    
    const avatarLocalPath = req.file?.path; // single file -> upload.single(), not .fields()

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findById(req.user._id);
    const oldAvatarUrl = user.avatar;

    user.avatar = avatar.url;
    await user.save({ validateBeforeSave: false });

    if (oldAvatarUrl) {
      await deleteFileFromCloudinary(oldAvatarUrl); // clean up only after new one is confirmed saved
    }

    // redis delete the invalidated cache
    await deleteCache(`channel:profile:${user.username}`); 

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
      throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findById(req.user._id);
    const oldCoverImageUrl = user.coverImage;

    user.coverImage = coverImage.url;
    await user.save({ validateBeforeSave: false });

    if (oldCoverImageUrl) {
      await deleteFileFromCloudinary(oldCoverImageUrl);
    }

    // redis delete the invalidated cache
    await deleteCache(`channel:profile:${user.username}`); 

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "Username is required");
    }

    const cacheKey = `channel:profile:${username.toLowerCase()}`;
    let channelData = await getCache(cacheKey);

    if (!channelData) {
      const channel = await User.aggregate([
        { $match: { username: username.toLowerCase() } },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
          },
        },
        {
          $addFields: {
            subscribersCount: { $size: "$subscribers" },
            channelsSubscribedToCount: { $size: "$subscribedTo" },
          },
        },
        {
          $project: {
            username: 1,
            fullName: 1,
            email: 1,
            avatar: 1,
            coverImage: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            createdAt: 1,
            // isSubscribed removed — this pipeline result is now viewer-independent
          },
        },
      ]);

      if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
      }

      channelData = channel[0];
      await setCache(cacheKey, channelData, 60);
    }

    // Viewer-specific — computed fresh on every request, never cached.
    // This is a single indexed lookup, effectively O(1), so there's no real cost to skipping the cache here.
    const isSubscribed = await Subscription.exists({
      subscriber: req.user._id,
      channel: channelData._id,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { ...channelData, isSubscribed: Boolean(isSubscribed) },
          "Channel profile fetched successfully"
        )
      );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    
    const user = await User.findById(req.user._id).populate({
      path: "watchHistory",
      populate: { path: "owner", select: "username fullName avatar" },
    });

    return res.status(200).json(new ApiResponse(200, user.watchHistory, "Watch history fetched successfully"));
});

export {
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};