import Provider from "../models/Provider.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { AppError } from "../middleware/error.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
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
    city,
    location,
  } = req.body;
  const resolvedCity =
    city?.trim() ||
    location?.city?.trim() ||
    null;
  let resolvedLocation;
  if (
    location?.coordinates?.length === 2 &&
    location.coordinates[0] !== 0 &&
    location.coordinates[1] !== 0
  ) {
    resolvedLocation = {
      type: "Point",
      coordinates: location.coordinates,
    };
  }

  const provider = await Provider.create({
    userId,
    organizationName,
    serviceType,
    licenseNumber:  licenseNumber  || null,
    operatingHours: operatingHours || undefined,
    servicesOffered: servicesOffered || [],
    contactNumber:  contactNumber  || null,
    address:        address?.trim() || null,
    city:           resolvedCity,
    location:       resolvedLocation,
    isAvailable:    true,
  });

  await User.findByIdAndUpdate(userId, { role: "provider" });

  res.status(201).json({
    success: true,
    message: "Provider registered successfully. Awaiting admin verification.",
    data: provider,
  });
});
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
  if (req.body.city !== undefined) {
    updates.city = req.body.city?.trim() || null;
  } else if (req.body.location?.city !== undefined) {
    updates.city = req.body.location.city?.trim() || null;
  }

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
export const toggleAvailability = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider) {
    throw new AppError("Provider profile not found", 404);
  }

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
      isAvailable:    provider.isAvailable,
      operatingHours: provider.operatingHours,
    },
  });
});
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
    throw new AppError(
      "Your account is not verified yet. Please wait for admin approval.",
      403
    );
  }

  if (!provider.isAvailable) {
    return res.status(200).json({
      success:  true,
      count:    0,
      data:     [],
      city:     provider.city || null,
      message:  "You are currently unavailable, so no new requests are shown.",
    });
  }
  const typeMap = {
  ambulance:  ["medical", "accident", "disaster", "other"],
  hospital:   ["medical", "accident", "disaster", "other"],
  blood_bank: ["blood"],
  rescue:     ["accident", "disaster", "other"],
  ngo:        ["accident", "disaster", "other"],
  other:      ["medical", "blood", "accident", "disaster", "other"],
};

  const relevantTypes = typeMap[provider.serviceType] || [];
  const providerCity = provider.city?.trim() || provider.address?.trim() || null;

  const query = {
    status:        "posted",
    emergencyType: { $in: relevantTypes },
  };

  if (providerCity) {
    query.city = new RegExp(`^${providerCity}$`, "i");
  } else {
    console.warn(
      `[getRelevantRequests] Provider ${provider._id} has no city set — returning nationwide results`
    );
  }

  const requests = await HelpRequest.find(query)
    .sort({ urgencyScore: -1, createdAt: -1 })
    .populate("requesterId", "name phone");

  res.status(200).json({
    success: true,
    count:   requests.length,
    city:    providerCity || null,
    data:    requests,
  });
});
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
    assignedTo:   provider._id,
    assignedType: "Provider",
    status:       { $in: ["accepted", "in_progress"] },
  })
    .sort({ acceptedAt: -1, createdAt: -1 })
    .populate("requesterId", "name phone");

  res.status(200).json({
    success:       true,
    activeRequest: activeRequest || null,
  });
});
export const acceptRequest = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user.id });

  if (!provider)             throw new AppError("Provider profile not found", 404);
  if (!provider.isVerified)  throw new AppError("Your account is not verified yet", 403);
  if (!provider.isAvailable) throw new AppError("You are currently unavailable", 400);

  const request = await HelpRequest.findById(req.params.id);

  if (!request)                    throw new AppError("Help request not found", 404);
  if (request.status !== "posted") throw new AppError("This request has already been taken", 400);

  request.status       = "accepted";
  request.assignedTo   = provider._id;
  request.assignedType = "Provider";
  request.acceptedAt   = new Date();
  request.responseTime = Math.round((new Date() - request.postedAt) / 60000);
  await request.save();
  provider.isAvailable = false;
  await provider.save();

  await Notification.create({
    recipientId:    request.requesterId,
    type:           "request_accepted",
    title:          "Help is on the way!",
    message:        `Your request has been accepted by ${provider.organizationName}.`,
    relatedRequest: request._id,
  });

  res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    data:    request,
  });
});
export const getAllProviders = asyncHandler(async (req, res) => {
  const { serviceType, isVerified, isAvailable, city, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (serviceType)               filter.serviceType  = serviceType;
  if (isVerified  !== undefined) filter.isVerified   = isVerified  === "true";
  if (isAvailable !== undefined) filter.isAvailable  = isAvailable === "true";
  if (city)                      filter.city         = new RegExp(`^${city.trim()}$`, "i");

  const skip = (Number(page) - 1) * Number(limit);

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
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
    data:  providers,
  });
});
export const verifyProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );

  if (!provider) throw new AppError("Provider not found", 404);

  await Notification.create({
    recipientId: provider.userId,
    type:        "account_verified",
    title:       "Account Verified!",
    message:     "Your provider account has been verified. You can now accept requests.",
  });

  res.status(200).json({
    success: true,
    message: "Provider verified successfully",
    data:    provider,
  });
});
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
    data:    provider,
  });
});