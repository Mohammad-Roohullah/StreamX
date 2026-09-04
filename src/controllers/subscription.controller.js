import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Subscription from "../models/subscription.model.js";

import { deleteCache } from "../utils/redisCache.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    await existingSubscription.deleteOne();

    // after creating/deleting the subscription doc, fetch the channel's username once:
    const channel = await User.findById(channelId).select("username");
    await deleteCache(`channel:profile:${channel.username}`);
    await deleteCache(`dashboard:stats:${channelId}`);

    return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed"));
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  // after creating/deleting the subscription doc, fetch the channel's username once:
  const channel = await User.findById(channelId).select("username");
  await deleteCache(`channel:profile:${channel.username}`);
  await deleteCache(`dashboard:stats:${channelId}`);

  return res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed"));
});

// who is subscribed to this channel (i.e., this channel's subscriber list)
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    { $unwind: "$subscriber" }, // flattens the array into a single object (alternative to $first)
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

// which channels has this user subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    { $unwind: "$channel" },
    {
      $project: {
        _id: 0,
        channel: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
});

export { toggleSubscription, getChannelSubscribers, getSubscribedChannels };