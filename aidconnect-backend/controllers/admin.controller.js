// controllers/admin.controller.js
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Rating from "../models/Rating.model.js";
import Volunteer from "../models/Volunteer.model.js";
import Provider from "../models/Provider.model.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// 👥 USER MANAGEMENT
// ─────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role, isActive, isBanned, isVerified,
    city, bloodGroup, page = 1, limit = 10, search,
  } = req.query;

  const filter = {};
  if (role)                    filter.role               = role;
  if (isActive !== undefined)  filter.isActive           = isActive === "true";
  if (isBanned !== undefined)  filter.isBanned           = isBanned === "true";
  if (isVerified !== undefined) filter.isVerified        = isVerified === "true";
  if (city)                    filter["location.city"]   = city;
  if (bloodGroup)              filter.bloodGroup         = bloodGroup;
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
    page:  parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshToken");
  if (!user) return sendError(res, 404, "User not found");
  return sendSuccess(res, 200, "User fetched", user);
});

export const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user)             return sendError(res, 404, "User not found");
  if (user.role === "admin") return sendError(res, 403, "Cannot ban an admin");

  user.isBanned     = true;
  user.bannedReason = reason || "Violated platform rules";
  user.isActive     = false;
  await user.save();

  return sendSuccess(res, 200, "User banned successfully", user.toPublicJSON());
});

export const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");

  user.isBanned     = false;
  user.bannedReason = null;
  user.isActive     = true;
  await user.save();

  return sendSuccess(res, 200, "User unbanned successfully", user.toPublicJSON());
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found");

  user.isVerified = true;
  await user.save();

  return sendSuccess(res, 200, "User verified successfully", user.toPublicJSON());
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)                 return sendError(res, 404, "User not found");
  if (user.role === "admin") return sendError(res, 403, "Cannot delete an admin");

  await User.findByIdAndDelete(req.params.id);
  return sendSuccess(res, 200, "User deleted successfully");
});

// ─────────────────────────────────────────────
// 📋 REQUEST MANAGEMENT
// ─────────────────────────────────────────────

export const getAllRequests = asyncHandler(async (req, res) => {
  const {
    status, emergencyType, urgencyLevel,
    city, page = 1, limit = 10,
  } = req.query;

  const filter = {};
  if (status)        filter.status        = status;
  if (emergencyType) filter.emergencyType = emergencyType;
  if (urgencyLevel)  filter.urgencyLevel  = urgencyLevel;
  if (city)          filter["location.city"] = city;

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
    page:  parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

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

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const [responseTimeStats] = await HelpRequest.aggregate([
    { $match: { responseTime: { $ne: null } } },
    { $group: { _id: null, avgResponseTime: { $avg: "$responseTime" } } },
  ]);

  const [
    totalUsers, totalVolunteers, totalProviders,
    activeVolunteers, verifiedProviders,
    totalRequests, completedRequests,
    cancelledRequests, criticalRequests, bannedUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "volunteer" }),
    User.countDocuments({ role: "provider" }),
    Volunteer.countDocuments({ isApproved: true, isSuspended: { $ne: true } }),
    Provider.countDocuments({ isVerified: true }),
    HelpRequest.countDocuments(),
    HelpRequest.countDocuments({ status: "completed" }),
    HelpRequest.countDocuments({ status: "cancelled" }),
    HelpRequest.countDocuments({ urgencyLevel: "critical" }),
    User.countDocuments({ isBanned: true }),
  ]);

  const [providerCredibilityStats] = await Provider.aggregate([
    {
      $group: {
        _id: null,
        averageProviderCredibility: { $avg: "$credibilityScore" },
        averageProviderRating:      { $avg: "$averageRating" },
      },
    },
  ]);

  return sendSuccess(res, 200, "Analytics overview fetched", {
    totalUsers,
    totalVolunteers,
    totalProviders,
    activeVolunteers,
    verifiedProviders,
    totalRequests,
    completedRequests,
    cancelledRequests,
    criticalRequests,
    bannedUsers,
    avgResponseTime:            Math.round(responseTimeStats?.avgResponseTime || 0),
    averageProviderCredibility: Math.round(providerCredibilityStats?.averageProviderCredibility || 0),
    averageProviderRating:      Number((providerCredibilityStats?.averageProviderRating || 0).toFixed(1)),
    completionRate: totalRequests > 0
      ? Number(((completedRequests / totalRequests) * 100).toFixed(1))
      : 0,
  });
});

export const getEmergencyTypeStats = asyncHandler(async (req, res) => {
  const stats = await HelpRequest.aggregate([
    { $group: { _id: "$emergencyType", count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
    { $project: { _id: 1, count: 1 } },
  ]);

  return sendSuccess(res, 200, "Emergency type stats fetched", stats);
});

export const getMonthlyTrends = asyncHandler(async (req, res) => {
  const trends = await HelpRequest.aggregate([
    {
      $group: {
        _id: {
          year:  { $year:  "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRequests:     { $sum: 1 },
        completedRequests: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
    {
      $project: {
        _id:               0,
        year:              "$_id.year",
        month:             "$_id.month",
        totalRequests:     1,
        completedRequests: 1,
      },
    },
  ]);

  const enrichedTrends = trends.map((trend) => ({
    ...trend,
    completionRate: trend.totalRequests > 0
      ? Number(((trend.completedRequests / trend.totalRequests) * 100).toFixed(1))
      : 0,
  }));

  return sendSuccess(res, 200, "Monthly trends fetched", enrichedTrends);
});

export const getTopVolunteers = asyncHandler(async (req, res) => {
  const topVolunteers = await Rating.getTopVolunteers(10);
  return sendSuccess(res, 200, "Top volunteers fetched", topVolunteers);
});

export const getTopProviders = asyncHandler(async (req, res) => {
  const providers = await Provider.find({ isVerified: true })
    .populate("userId", "name email phone")
    .sort({ credibilityScore: -1, averageRating: -1, totalRatings: -1 })
    .limit(10);

  return sendSuccess(res, 200, "Top providers fetched", providers);
});

// FIX: use $nin to exclude null, undefined, and empty string ""
// Previously only excluded null — empty string city values slipped through
// and caused the aggregation to return no meaningful grouped results.
export const getHighRiskAreas = asyncHandler(async (req, res) => {
  const areas = await HelpRequest.aggregate([
    {
      $match: {
        "location.city": { $exists: true, $nin: [null, "", undefined] },
      },
    },
    {
      $group: {
        _id:               "$location.city",
        totalRequests:     { $sum: 1 },
        completedRequests: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $sort:  { totalRequests: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id:               0,
        city:              "$_id",
        totalRequests:     1,
        completedRequests: 1,
      },
    },
  ]);

  const enrichedAreas = areas.map((area) => ({
    ...area,
    count: area.totalRequests,
    completionRate: area.totalRequests > 0
      ? Number(((area.completedRequests / area.totalRequests) * 100).toFixed(1))
      : 0,
  }));

  return sendSuccess(res, 200, "High risk areas fetched", enrichedAreas);
});