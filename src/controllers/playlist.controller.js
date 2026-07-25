import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Playlist from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
    videos: [], // starts empty
  });

  return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  // const { userId } = req.params;

  const userId = req.user._id;

  const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId).populate({
    path: "videos",
    populate: { path: "owner", select: "username fullName avatar" },
  });

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to get this playlist");
  }

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  // avoid duplicate entries — only push if not already present
  if (playlist.videos.some((v) => v.toString() === videoId)) {
    throw new ApiError(400, "Video already in playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  playlist.videos = playlist.videos.filter((v) => v.toString() !== videoId);
  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to edit this playlist");
  }

  if (name) playlist.name = name;
  if (description) playlist.description = description;
  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }

  await playlist.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};