// controllers/provider.controller.js

import Provider from "../models/Provider.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { AppError } from "../middleware/error.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────
// POST /api/providers/register
// Access: Private (logged in user)
// ─────────────────────────────────────────
export const registerProvider = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const existing = await Provider.findOne({ userId });
  if (existing) {
    throw new AppError("You are already registered as a provider", 400);
  }

  const {
    organizationName,
    serviceType,
    licenseNumber,
    operatingHours,
    servicesOffered,
    contactNumber,
    address,
    location,
  } = req.body;

  const provider = await Provider.create({
    userId,
    organizationName,
    serviceType,
    licenseNumber,
    operatingHours,
    servicesOffered,
    contactNumber,
    address,
    location,
    isAvailable: true,
  });

  await User.findByIdAndUpdate(userId, { role: "provider" });

  res.status(201).json({
    success: true,
    message: "Provider registered successfully. Awaiting admin verification.",
    data: provider,
  });
});

// ─────────────────────────────────────────
// GET /api/providers/profile
// Access: Private (provider only)
// ─────────────────────────────────────────
export const getProviderProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id })
    .populate("userId", "name email phone profileImage");

  if (!provider) {
    return res.status(404).json({
      success: false,
      message: "Provider profile not found. Please register as a provider first.",
      code: "PROVIDER_PROFILE_MISSING",
    });
  }

  res.status(200).json({
    success: true,
    data: provider,
  });
});

// ─────────────────────────────────────────
// PUT /api/providers/profile
// Access: Private (provider only)
// ─────────────────────────────────────────
export const updateProviderProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "organizationName",
    "licenseNumber",
    "operatingHours",
    "servicesOffered",
    "contactNumber",
    "address",
    "location",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const provider = await Provider.findOneAndUpdate(
    { userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: provider,
  });
});

// ─────────────────────────────────────────
// PUT /api/providers/availability
// Access: Private (provider only)
// ─────────────────────────────────────────
export const toggleAvailability = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  // If the client sends an explicit state, use it.
  // Otherwise preserve the old toggle behavior for simple button clicks.
  if (typeof req.body.isAvailable === "boolean") {
    provider.isAvailable = req.body.isAvailable;
  } else {
    provider.isAvailable = !provider.isAvailable;
  }

  if (req.body.operatingHours) {
    provider.operatingHours = req.body.operatingHours;
  }

  await provider.save();

  res.status(200).json({
    success: true,
    message: `You are now ${provider.isAvailable ? "available" : "unavailable"}`,
    data: {
      isAvailable: provider.isAvailable,
      operatingHours: provider.operatingHours,
    },
  });
});

// ─────────────────────────────────────────
// GET /api/providers/requests
// Access: Private (provider only)
// ─────────────────────────────────────────
export const getRelevantRequests = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    return res.status(404).json({
      success: false,
      message: "Provider profile not found. Please register as a provider first.",
      code: "PROVIDER_PROFILE_MISSING",
    });
  }

  if (!provider.isVerified) {
    throw new AppError("Your account is not verified yet. Please wait for admin approval.", 403);
  }

  if (!provider.isAvailable) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "You are currently unavailable, so no new requests are shown.",
    });
  }

  const typeMap = {
    ambulance:  ["medical", "accident"],
    hospital:   ["medical", "accident"],
    blood_bank: ["blood"],
    rescue:     ["disaster", "accident"],
    ngo:        ["disaster", "other"],
    other:      ["medical", "blood", "accident", "disaster", "other"],
  };

  const relevantTypes = typeMap[provider.serviceType] || [];

  const requests = await HelpRequest.find({
    status: "posted",
    emergencyType: { $in: relevantTypes },
  })
    .sort({ urgencyScore: -1 })
    .populate("requesterId", "name phone");

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// ─────────────────────────────────────────
// GET /api/providers/requests/active
// Access: Private (provider only)
// ─────────────────────────────────────────
export const getActiveRequest = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    return res.status(404).json({
      success: false,
      message: "Provider profile not found. Please register as a provider first.",
      code: "PROVIDER_PROFILE_MISSING",
    });
  }

  const activeRequest = await HelpRequest.findOne({
    assignedTo: provider._id,
    assignedType: "Provider",
    status: { $in: ["accepted", "in_progress"] },
  })
    .sort({ acceptedAt: -1, createdAt: -1 })
    .populate("requesterId", "name phone");

  res.status(200).json({
    success: true,
    activeRequest: activeRequest || null,
  });
});

// ─────────────────────────────────────────
// PUT /api/providers/requests/:id/accept
// Access: Private (provider only)
// ─────────────────────────────────────────
export const acceptRequest = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) throw new AppError("Provider profile not found", 404);
  if (!provider.isVerified) throw new AppError("Your account is not verified yet", 403);
  if (!provider.isAvailable) throw new AppError("You are currently unavailable", 400);

  const request = await HelpRequest.findById(req.params.id);

  if (!request) throw new AppError("Help request not found", 404);
  if (request.status !== "posted") throw new AppError("This request has already been taken", 400);

  request.status = "accepted";
  request.assignedTo = provider._id;
  request.assignedType = "Provider";
  request.acceptedAt = new Date();
  request.responseTime = Math.round((new Date() - request.postedAt) / 60000);
  await request.save();

  provider.isAvailable = false;
  await provider.save();

  await Notification.create({
    recipientId: request.requesterId,
    type: "request_accepted",
    title: "Help is on the way!",
    message: `Your request has been accepted by ${provider.organizationName}.`,
    relatedRequest: request._id,
  });

  res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    data: request,
  });
});

// ─────────────────────────────────────────
// GET /api/providers/
// Access: Private (admin only)
// ─────────────────────────────────────────
export const getAllProviders = asyncHandler(async (req, res) => {
  const { serviceType, isVerified, isAvailable, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (serviceType) filter.serviceType = serviceType;
  if (isVerified !== undefined) filter.isVerified = isVerified === "true";
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";

  const skip = (page - 1) * limit;

  const [providers, total] = await Promise.all([
    Provider.find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Provider.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: providers,
  });
});

// ─────────────────────────────────────────
// PUT /api/providers/:id/verify
// Access: Private (admin only)
// ─────────────────────────────────────────
export const verifyProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );

  if (!provider) throw new AppError("Provider not found", 404);

  await Notification.create({
    recipientId: provider.userId,
    type: "account_verified",
    title: "Account Verified!",
    message: "Your provider account has been verified. You can now accept requests.",
  });

  res.status(200).json({
    success: true,
    message: "Provider verified successfully",
    data: provider,
  });
});

// ─────────────────────────────────────────
// PUT /api/providers/:id/suspend
// Access: Private (admin only)
// ─────────────────────────────────────────
export const suspendProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { isVerified: false, isAvailable: false },
    { new: true }
  );

  if (!provider) throw new AppError("Provider not found", 404);

  res.status(200).json({
    success: true,
    message: "Provider suspended successfully",
    data: provider,
  });
});