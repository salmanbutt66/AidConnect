// controllers/user.controller.js
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Rating from "../models/Rating.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// 👤 PROFILE MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/users/profile
// Get logged in user's own profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    return res.status(404).json(apiResponse(404, "User not found"));
  }

  return res
    .status(200)
    .json(apiResponse(200, "Profile fetched successfully", user));
});

// PATCH /api/users/profile
// Update logged in user's own profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    bloodGroup,
    city,
    area,
    lat,
    lng,
    notificationPreferences,
  } = req.body;

  // Build update object — only update fields that were sent
  const updates = {};

  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (bloodGroup) updates.bloodGroup = bloodGroup;
  if (notificationPreferences)
    updates.notificationPreferences = notificationPreferences;

  // Location fields grouped
  if (city) updates["location.city"] = city;
  if (area) updates["location.area"] = area;
  if (lat) updates["location.coordinates.lat"] = lat;
  if (lng) updates["location.coordinates.lng"] = lng;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(apiResponse(200, "Profile updated successfully", updatedUser));
});

// PATCH /api/users/profile/picture
// Update profile picture URL
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res
      .status(400)
      .json(apiResponse(400, "Profile picture URL is required"));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { profilePicture } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      apiResponse(200, "Profile picture updated successfully", updatedUser)
    );
});

// PATCH /api/users/change-password
// Change own password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json(apiResponse(400, "Both current and new password are required"));
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json(apiResponse(400, "New password must be at least 6 characters"));
  }

  // Need password field — use +password to override select:false
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res
      .status(401)
      .json(apiResponse(401, "Current password is incorrect"));
  }

  user.password = newPassword;
  await user.save(); // pre-save hook will hash it

  return res
    .status(200)
    .json(apiResponse(200, "Password changed successfully"));
});

// ─────────────────────────────────────────────
// 📋 USER'S REQUEST HISTORY
// ─────────────────────────────────────────────

// GET /api/users/my-requests
// Get all requests made by logged in user
export const getMyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { requestedBy: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    HelpRequest.countDocuments(filter),
  ]);

  return res.status(200).json(
    apiResponse(200, "Your requests fetched successfully", {
      requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});

// GET /api/users/my-requests/:id
// Get single request detail
export const getMyRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findOne({
    _id: req.params.id,
    requestedBy: req.user._id, // security: user can only see their own
  });

  if (!request) {
    return res
      .status(404)
      .json(apiResponse(404, "Request not found or not yours"));
  }

  return res
    .status(200)
    .json(apiResponse(200, "Request fetched successfully", request));
});

// ─────────────────────────────────────────────
// ⭐ RATINGS
// ─────────────────────────────────────────────

// POST /api/users/rate
// User rates a volunteer after request is completed
export const rateVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId, helpRequestId, score, comment } = req.body;

  if (!volunteerId || !helpRequestId || !score) {
    return res
      .status(400)
      .json(apiResponse(400, "volunteerId, helpRequestId and score are required"));
  }

  // Verify the request exists and belongs to this user
  const request = await HelpRequest.findOne({
    _id: helpRequestId,
    requestedBy: req.user._id,
    status: "completed", // can only rate completed requests
  });

  if (!request) {
    return res
      .status(404)
      .json(
        apiResponse(
          404,
          "Completed request not found or you are not the requester"
        )
      );
  }

  // Verify volunteer exists and has volunteer role
  const volunteer = await User.findOne({
    _id: volunteerId,
    role: "volunteer",
  });

  if (!volunteer) {
    return res.status(404).json(apiResponse(404, "Volunteer not found"));
  }

  // Check if already rated — compound index will also catch this
  const existing = await Rating.findOne({
    ratedBy: req.user._id,
    helpRequest: helpRequestId,
  });

  if (existing) {
    return res
      .status(409)
      .json(apiResponse(409, "You have already rated this request"));
  }

  const rating = await Rating.create({
    ratedBy: req.user._id,
    ratedTo: volunteerId,
    helpRequest: helpRequestId,
    score,
    comment: comment || null,
  });

  return res
    .status(201)
    .json(apiResponse(201, "Rating submitted successfully", rating));
});

// GET /api/users/volunteer/:id/ratings
// Get all ratings of a specific volunteer (public)
export const getVolunteerRatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [ratings, total, avgData] = await Promise.all([
    Rating.find({ ratedTo: req.params.id, isDeleted: false })
      .populate("ratedBy", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Rating.countDocuments({ ratedTo: req.params.id, isDeleted: false }),
    Rating.getAverageScore(req.params.id),
  ]);

  return res.status(200).json(
    apiResponse(200, "Volunteer ratings fetched", {
      averageScore: avgData.averageScore,
      totalRatings: avgData.totalRatings,
      ratings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});

// ─────────────────────────────────────────────
// 🔔 NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────

// PATCH /api/users/notification-preferences
// Toggle email / inApp notifications
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, inApp } = req.body;

  const updates = {};
  if (email !== undefined) updates["notificationPreferences.email"] = email;
  if (inApp !== undefined) updates["notificationPreferences.inApp"] = inApp;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  ).select("notificationPreferences");

  return res
    .status(200)
    .json(
      apiResponse(200, "Notification preferences updated", updatedUser)
    );
});