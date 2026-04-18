import Provider from "../models/Provider.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";

// POST /api/providers/register
// Access: Private (logged in user)
// Registers current user as a service provider

export const registerProvider = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if already registered as provider
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
  });

  // Update user role to provider
  await User.findByIdAndUpdate(userId, { role: "provider" });

  res.status(201).json({
    success: true,
    message: "Provider registered successfully. Awaiting admin verification.",
    data: provider,
  });
});

// GET /api/providers/profile
// Access: Private (provider only)

export const getProviderProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id })
    .populate("userId", "name email phone profileImage");

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  res.status(200).json({
    success: true,
    data: provider,
  });
});

// PUT /api/providers/profile
// Access: Private (provider only)

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

  // Only pick allowed fields from body — ignore anything else
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

// PUT /api/providers/availability
// Access: Private (provider only)
// Toggles isAvailable + optionally updates operating hours

export const toggleAvailability = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  // Flip current availability
  provider.isAvailable = !provider.isAvailable;

  // Optionally update operating hours at the same time
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

// GET /api/providers/requests
// Access: Private (provider only)
// Returns open help requests relevant to this provider's service type

export const getRelevantRequests = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  if (!provider.isVerified) {
    throw new AppError("Your account is not verified yet. Please wait for admin approval.", 403);
  }

  // Map provider service type to relevant emergency types
  const typeMap = {
    ambulance: ["medical", "accident"],
    hospital: ["medical", "accident"],
    blood_bank: ["blood"],
    rescue: ["disaster", "accident"],
    ngo: ["disaster", "other"],
    other: ["medical", "blood", "accident", "disaster", "other"],
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

// PUT /api/providers/requests/:id/accept
// Access: Private (provider only)
// Provider accepts an open help request

export const acceptRequest = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

  if (!provider.isVerified) {
    throw new AppError("Your account is not verified yet", 403);
  }

  if (!provider.isAvailable) {
    throw new AppError("You are currently unavailable", 400);
  }

  const request = await HelpRequest.findById(req.params.id);

  if (!request) {
    throw new AppError("Help request not found", 404);
  }

  if (request.status !== "posted") {
    throw new AppError("This request has already been taken", 400);
  }

  // Update request
  request.status = "accepted";
  request.assignedTo = provider._id;
  request.assignedType = "Provider";
  request.acceptedAt = new Date();
  request.responseTime = Math.round(
    (new Date() - request.postedAt) / 60000
  );
  await request.save();

  // Mark provider as unavailable
  provider.isAvailable = false;
  await provider.save();

  // Notify the requester
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

// GET /api/providers/
// Access: Private (admin only)

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

// PUT /api/providers/:id/verify
// Access: Private (admin only)

export const verifyProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );

  if (!provider) {
    throw new AppError("Provider not found", 404);
  }

  // Notify the provider
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

// PUT /api/providers/:id/suspend
// Access: Private (admin only)

export const suspendProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { isVerified: false, isAvailable: false },
    { new: true }
  );

  if (!provider) {
    throw new AppError("Provider not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Provider suspended successfully",
    data: provider,
  });
});