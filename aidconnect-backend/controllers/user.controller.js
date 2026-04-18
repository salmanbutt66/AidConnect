// controllers/user.controller.js
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Rating from "../models/Rating.model.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// 👤 PROFILE MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/users/profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );

  if (!user) return sendError(res, 404, "User not found");

  return sendSuccess(res, 200, "Profile fetched successfully", user);
});

// PATCH /api/users/profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone, bloodGroup, city, area, longitude, latitude, notificationPreferences } = req.body;

  const updates = {};

  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (bloodGroup) updates.bloodGroup = bloodGroup;
  if (notificationPreferences) updates.notificationPreferences = notificationPreferences;
  if (city) updates["location.city"] = city;
  if (area) updates["location.area"] = area;

  // GeoJSON coordinates update
  if (longitude !== undefined && latitude !== undefined) {
    updates["location.coordinates"] = [longitude, latitude];
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return sendSuccess(res, 200, "Profile updated successfully", updatedUser);
});

// PATCH /api/users/profile/picture
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const { profilePicture } = req.body;

  if (!profilePicture) return sendError(res, 400, "Profile picture URL is required");

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { profilePicture } },
    { new: true }
  ).select("-password -refreshToken");

  return sendSuccess(res, 200, "Profile picture updated successfully", updatedUser);
});

// PATCH /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, 400, "Both current and new password are required");
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user.id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return sendError(res, 401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 200, "Password changed successfully");
});

// ─────────────────────────────────────────────
// 📋 USER'S REQUEST HISTORY
// ─────────────────────────────────────────────

// GET /api/users/my-requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { requesterId: req.user.id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    HelpRequest.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Your requests fetched successfully", {
    requests,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/users/my-requests/:id
export const getMyRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findOne({
    _id: req.params.id,
    requesterId: req.user.id,
  });

  if (!request) return sendError(res, 404, "Request not found or not yours");

  return sendSuccess(res, 200, "Request fetched successfully", request);
});

// ─────────────────────────────────────────────
// ⭐ RATINGS
// ─────────────────────────────────────────────

// POST /api/users/rate
export const rateVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId, helpRequestId, score, comment } = req.body;

  if (!volunteerId || !helpRequestId || !score) {
    return sendError(res, 400, "volunteerId, helpRequestId and score are required");
  }

  const request = await HelpRequest.findOne({
    _id: helpRequestId,
    requesterId: req.user.id,
    status: "completed",
  });

  if (!request) {
    return sendError(res, 404, "Completed request not found or you are not the requester");
  }

  const volunteer = await User.findOne({ _id: volunteerId, role: "volunteer" });
  if (!volunteer) return sendError(res, 404, "Volunteer not found");

  const existing = await Rating.findOne({
    ratedBy: req.user.id,
    helpRequest: helpRequestId,
  });

  if (existing) return sendError(res, 409, "You have already rated this request");

  const rating = await Rating.create({
    ratedBy: req.user.id,
    ratedTo: volunteerId,
    helpRequest: helpRequestId,
    score,
    comment: comment || null,
  });

  return sendSuccess(res, 201, "Rating submitted successfully", rating);
});

// GET /api/users/volunteer/:id/ratings
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

  return sendSuccess(res, 200, "Volunteer ratings fetched", {
    averageScore: avgData.averageScore,
    totalRatings: avgData.totalRatings,
    ratings,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─────────────────────────────────────────────
// 🔔 NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────

// PATCH /api/users/notification-preferences
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, inApp } = req.body;

  const updates = {};
  if (email !== undefined) updates["notificationPreferences.email"] = email;
  if (inApp !== undefined) updates["notificationPreferences.inApp"] = inApp;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true }
  ).select("notificationPreferences");

  return sendSuccess(res, 200, "Notification preferences updated", updatedUser);
});