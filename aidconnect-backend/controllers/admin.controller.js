// controllers/admin.controller.js
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Rating from "../models/Rating.model.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// 👥 USER MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role, isActive, isBanned, isVerified,
    city, bloodGroup, page = 1, limit = 10, search,
  } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isBanned !== undefined) filter.isBanned = isBanned === "true";
  if (isVerified !== undefined) filter.isVerified = isVerified === "true";
  if (city) filter["location.city"] = city;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, "Users fetched successfully", users, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// GET /api/admin/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshToken");

  if (!user) return sendError(res, 404, "User not found");

  return sendSuccess(res, 200, "User fetched", user);
});

// PATCH /api/admin/users/:id/ban
export const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");
  if (user.role === "admin") return sendError(res, 403, "Cannot ban an admin");

  user.isBanned     = true;
  user.bannedReason = reason || "Violated platform rules";
  user.isActive     = false;
  await user.save();

  return sendSuccess(res, 200, "User banned successfully", user.toPublicJSON());
});

// PATCH /api/admin/users/:id/unban
export const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");

  user.isBanned     = false;
  user.bannedReason = null;
  user.isActive     = true;
  await user.save();

  return sendSuccess(res, 200, "User unbanned successfully", user.toPublicJSON());
});

// PATCH /api/admin/users/:id/verify
export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");

  user.isVerified = true;
  await user.save();

  return sendSuccess(res, 200, "User verified successfully", user.toPublicJSON());
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");
  if (user.role === "admin") return sendError(res, 403, "Cannot delete an admin");

  await User.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, "User deleted successfully");
});

// ─────────────────────────────────────────────
// 📋 REQUEST MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/admin/requests
export const getAllRequests = asyncHandler(async (req, res) => {
  const {
    status, emergencyType, urgencyLevel,
    city, page = 1, limit = 10,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (emergencyType) filter.emergencyType = emergencyType;
  if (urgencyLevel) filter.urgencyLevel = urgencyLevel;
  if (city) filter["location.city"] = city;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .populate("requesterId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    HelpRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, "Requests fetched successfully", requests, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// PATCH /api/admin/requests/:id/cancel
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) return sendError(res, 404, "Request not found");

  if (request.status === "completed") {
    return sendError(res, 400, "Cannot cancel a completed request");
  }

  request.status = "cancelled";
  await request.save();

  return sendSuccess(res, 200, "Request cancelled successfully", request);
});

// ─────────────────────────────────────────────
// 📊 ANALYTICS
// ─────────────────────────────────────────────

// GET /api/admin/analytics/overview
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalVolunteers, totalProviders,
    totalRequests, completedRequests,
    cancelledRequests, bannedUsers,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "volunteer" }),
    User.countDocuments({ role: "provider" }),
    HelpRequest.countDocuments(),
    HelpRequest.countDocuments({ status: "completed" }),
    HelpRequest.countDocuments({ status: "cancelled" }),
    User.countDocuments({ isBanned: true }),
  ]);

  return sendSuccess(res, 200, "Analytics overview fetched", {
    totalUsers,
    totalVolunteers,
    totalProviders,
    totalRequests,
    completedRequests,
    cancelledRequests,
    bannedUsers,
    completionRate: totalRequests > 0
      ? ((completedRequests / totalRequests) * 100).toFixed(1) + "%"
      : "0%",
  });
});

// GET /api/admin/analytics/emergency-types
export const getEmergencyTypeStats = asyncHandler(async (req, res) => {
  const stats = await HelpRequest.aggregate([
    { $group: { _id: "$emergencyType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { emergencyType: "$_id", count: 1, _id: 0 } },
  ]);

  return sendSuccess(res, 200, "Emergency type stats fetched", stats);
});

// GET /api/admin/analytics/monthly-trends
export const getMonthlyTrends = asyncHandler(async (req, res) => {
  const trends = await HelpRequest.aggregate([
    {
      $group: {
        _id: {
          year:  { $year:  "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRequests: { $sum: 1 },
        completedRequests: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
    {
      $project: {
        _id: 0,
        year:              "$_id.year",
        month:             "$_id.month",
        totalRequests:     1,
        completedRequests: 1,
      },
    },
  ]);

  return sendSuccess(res, 200, "Monthly trends fetched", trends);
});

// GET /api/admin/analytics/top-volunteers
export const getTopVolunteers = asyncHandler(async (req, res) => {
  const topVolunteers = await Rating.getTopVolunteers(10);

  return sendSuccess(res, 200, "Top volunteers fetched", topVolunteers);
});

// GET /api/admin/analytics/high-risk-areas
export const getHighRiskAreas = asyncHandler(async (req, res) => {
  const areas = await HelpRequest.aggregate([
    { $match: { "location.city": { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$location.city",
        totalRequests: { $sum: 1 },
        completedRequests: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { totalRequests: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        city:              "$_id",
        totalRequests:     1,
        completedRequests: 1,
      },
    },
  ]);

  return sendSuccess(res, 200, "High risk areas fetched", areas);
});