import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { options } from "../constants.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import { setCache, getCache, deleteCache } from "../utils/redisCache.js";

const generateAccessAndRefreshToken = async (userId) => {
    
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // // this will save the refresh token to the database without validating other fields

        return { accessToken, refreshToken };
    } 
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const register = asyncHandler(async (req, res) => {
  
    const { username, email, fullName, password } = req.body;

    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
   
    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadFileOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    // re-fetch without sensitive fields rather than trusting the in-memory object
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
    
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
        new ApiResponse( 
                200, 
                { 
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    },
                }, 
                "Logged in successfully"
            )
        );
});

const logout = asyncHandler(async (req, res) => {
  
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.userId);
        if (!user) {
        throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token expired");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"));
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond the same way, regardless of whether the user exists —
    // prevents attackers from using this endpoint to enumerate valid emails.
    const genericResponse = new ApiResponse(
        200,
        {},
        "If that email is registered, a reset code has been sent"
    );

    if (!user) {
        return res.status(200).json(genericResponse);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric
    const hashedOtp = await bcrypt.hash(otp, 10);

    await setCache(`otp:reset:${user._id}`, hashedOtp, 600); // 10 min TTL

    await sendEmail({
        to: user.email,
        subject: "Your password reset code",
        html: `<p>Your password reset code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.status(200).json(genericResponse);
});

const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "Invalid or expired code");
    }

    const storedHashedOtp = await getCache(`otp:reset:${user._id}`);
    if (!storedHashedOtp) {
        throw new ApiError(400, "Invalid or expired code");
    }

    const isOtpValid = await bcrypt.compare(otp, storedHashedOtp);
    if (!isOtpValid) {
        throw new ApiError(400, "Invalid or expired code");
    }

    // OTP confirmed — issue a short-lived, single-purpose reset token
    const resetToken = jwt.sign(
        { userId: user._id },
        process.env.RESET_TOKEN_SECRET,
        { expiresIn: "10m" }
    );

    await deleteCache(`otp:reset:${user._id}`); // one-time use

    return res.status(200).json(new ApiResponse(200, { resetToken }, "Code verified"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        throw new ApiError(400, "Reset token and new password are required");
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword; // pre-save hook re-hashes
    user.refreshToken = undefined; // invalidate existing sessions everywhere
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. Please log in again."));
});

export { register, login, logout, refreshAccessToken, forgotPassword, verifyResetOtp, resetPassword };