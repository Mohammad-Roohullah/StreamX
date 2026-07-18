import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";

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

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
};