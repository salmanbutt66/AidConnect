// controllers/request.controller.js
import HelpRequest from "../models/HelpRequest.model.js";
import Match from "../models/Match.model.js";
import Rating from "../models/Rating.model.js";
import Volunteer from "../models/Volunteer.model.js";
import Provider from "../models/Provider.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { createGeoPoint, isValidCoordinates } from "../utils/geoHelper.js";
import { findAndCreateMatches, handleVolunteerResponse } from "../services/matching.service.js";
import { notifyRequestCompleted, notifyRequestCancelled } from "../services/notification.service.js";
import ScoringService from "../services/scoring.service.js";

const getProviderCredibilityScore = (averageRating, totalRatings) => {
  if (!totalRatings) return 50;
  return Math.round(Math.max(0, Math.min(100, (averageRating / 5) * 100)));
};

// ─────────────────────────────────────────
// CREATE REQUEST
// POST /api/requests
// ─────────────────────────────────────────
export const createRequest = asyncHandler(async (req, res) => {
  const {
    emergencyType, urgencyLevel, description,
    longitude, latitude, address,
    bloodGroupNeeded, proofImage,
  } = req.body;

  if (!emergencyType || !urgencyLevel || !description) {
    return sendError(res, 400, "Emergency type, urgency level and description are required");
  }

  if (!longitude || !latitude) {
    return sendError(res, 400, "Location coordinates are required");
  }

  if (!isValidCoordinates(Number(longitude), Number(latitude))) {
    return sendError(res, 400, "Invalid coordinates provided");
  }

  if (emergencyType === "blood" && !bloodGroupNeeded) {
    return sendError(res, 400, "Blood group is required for blood emergency requests");
  }

  const request = await HelpRequest.create({
    requesterId:      req.user.id,
    emergencyType,
    urgencyLevel,
    description,
    bloodGroupNeeded: emergencyType === "blood" ? bloodGroupNeeded : null,
    proofImage:       proofImage || null,
    address:          address || null,
    location:         createGeoPoint(Number(longitude), Number(latitude)),
    status:           "posted",
    postedAt:         new Date(),
  });

  findAndCreateMatches(request).catch((err) => {
    console.error("Matching engine failed for request:", request._id, err.message);
  });

  return sendSuccess(res, 201, "Help request posted successfully. Finding nearby responders...", request);
});

// ─────────────────────────────────────────
// GET MY REQUESTS
// GET /api/requests/my
// ─────────────────────────────────────────
export const getMyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { requesterId: req.user.id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("assignedTo", "name phone"),
    HelpRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, "Your requests fetched successfully", requests, {
    total,
    page:  Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// GET NEARBY REQUESTS
// GET /api/requests/nearby
// ─────────────────────────────────────────
export const getNearbyRequests = asyncHandler(async (req, res) => {
  const {
    longitude, latitude,
    radius = 10,
    emergencyType,
    page = 1,
    limit = 10,
  } = req.query;

  if (!longitude || !latitude) {
    return sendError(res, 400, "Your location coordinates are required");
  }

  const skip = (Number(page) - 1) * Number(limit);

  const filter = {
    status: "posted",
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: Number(radius) * 1000,
      },
    },
  };

  if (emergencyType) filter.emergencyType = emergencyType;

  const requests = await HelpRequest.find(filter)
    .sort({ urgencyScore: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("requesterId", "name phone");

  const total = await HelpRequest.countDocuments({
    status: "posted",
    ...(emergencyType && { emergencyType }),
  });

  return sendPaginated(res, "Nearby requests fetched successfully", requests, {
    total,
    page:  Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// GET REQUEST BY ID
// GET /api/requests/:id
// ─────────────────────────────────────────
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate("requesterId", "name phone email")
    .populate("assignedTo");

  if (!request) return sendError(res, 404, "Request not found");

  return sendSuccess(res, 200, "Request fetched successfully", request);
});

// ─────────────────────────────────────────
// CANCEL REQUEST
// PUT /api/requests/:id/cancel
// ─────────────────────────────────────────
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);

  if (!request) return sendError(res, 404, "Request not found");

  if (request.requesterId.toString() !== req.user.id) {
    return sendError(res, 403, "You can only cancel your own requests");
  }

  if (["completed", "cancelled"].includes(request.status)) {
    return sendError(res, 400, `Cannot cancel a request that is already ${request.status}`);
  }

  request.status      = "cancelled";
  request.cancelledAt = new Date();
  await request.save();

  if (request.assignedTo) {
    await notifyRequestCancelled(request.assignedTo, request);
  }

  await Match.updateMany(
    { requestId: request._id, status: "notified" },
    { status: "expired" }
  );

  return sendSuccess(res, 200, "Request cancelled successfully", request);
});

// ─────────────────────────────────────────
// ACCEPT REQUEST
// PUT /api/requests/:id/accept
// ─────────────────────────────────────────
export const acceptRequest = asyncHandler(async (req, res) => {
  const { matchId } = req.body;

  if (!matchId) return sendError(res, 400, "Match ID is required");

  const match = await handleVolunteerResponse(matchId, req.user.id, "accepted");

  return sendSuccess(res, 200, "Request accepted successfully. Please head to the location.", match);
});

// ─────────────────────────────────────────
// UPDATE REQUEST STATUS
// PUT /api/requests/:id/status
// ─────────────────────────────────────────
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) return sendError(res, 400, "Status is required");

  const validTransitions = {
    accepted:    ["in_progress"],
    in_progress: ["completed"],
  };

  const request = await HelpRequest.findById(req.params.id);

  if (!request) return sendError(res, 404, "Request not found");

  if (!request.assignedTo || !request.assignedType) {
    return sendError(res, 400, "No responder is assigned to this request");
  }

  let isAssignedResponder = false;

  if (request.assignedType === "Volunteer" && req.user.role === "volunteer") {
    const volunteer = await Volunteer.findOne({ user: req.user.id }).select("_id");
    isAssignedResponder =
      !!volunteer && request.assignedTo.toString() === volunteer._id.toString();
  }

  if (request.assignedType === "Provider" && req.user.role === "provider") {
    const provider = await Provider.findOne({ userId: req.user.id }).select("_id");
    isAssignedResponder =
      !!provider && request.assignedTo.toString() === provider._id.toString();
  }

  if (!isAssignedResponder) {
    return sendError(res, 403, "You are not assigned to this request");
  }

  const allowedNextStatuses = validTransitions[request.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    return sendError(res, 400, `Cannot transition from ${request.status} to ${status}`);
  }

  request.status = status;

  if (status === "completed") {
    request.completedAt    = new Date();
    const diffMs           = request.completedAt - request.postedAt;
    request.resolutionTime = Math.round(diffMs / 1000 / 60);

    if (request.assignedType === "Provider") {
      await Provider.findByIdAndUpdate(request.assignedTo, { isAvailable: true });
    }

    await notifyRequestCompleted(request.requesterId, request);
  }

  await request.save();

  return sendSuccess(res, 200, `Request status updated to ${status}`, request);
});

// ─────────────────────────────────────────
// RATE REQUEST
// POST /api/requests/:id/rate
// FIX: frontend sends { score, comment } — was incorrectly reading { rating }
// ─────────────────────────────────────────
export const rateRequest = asyncHandler(async (req, res) => {
  // FIX: destructure 'score' not 'rating'
  const { score, comment } = req.body;

  if (!score || score < 1 || score > 5) {
    return sendError(res, 400, "Rating score must be between 1 and 5");
  }

  const request = await HelpRequest.findById(req.params.id);

  if (!request) return sendError(res, 404, "Request not found");

  if (request.requesterId.toString() !== req.user.id) {
    return sendError(res, 403, "You can only rate your own requests");
  }

  if (request.status !== "completed") {
    return sendError(res, 400, "You can only rate completed requests");
  }

  if (!request.assignedTo) {
    return sendError(res, 400, "No responder assigned to rate");
  }

  const recipientType = request.assignedType;
  if (!recipientType || !["Volunteer", "Provider"].includes(recipientType)) {
    return sendError(res, 400, "This request cannot be rated");
  }

  let recipientUserId  = null;
  let volunteerProfile = null;
  let providerProfile  = null;

  if (recipientType === "Volunteer") {
    volunteerProfile = await Volunteer.findById(request.assignedTo);
    if (!volunteerProfile) return sendError(res, 404, "Volunteer profile not found");
    recipientUserId = volunteerProfile.user;
  }

  if (recipientType === "Provider") {
    providerProfile = await Provider.findById(request.assignedTo);
    if (!providerProfile) return sendError(res, 404, "Provider profile not found");
    recipientUserId = providerProfile.userId;
  }

  const existingRating = await Rating.findOne({
    helpRequest: request._id,
    ratedBy:     req.user.id,
  });

  if (existingRating) return sendError(res, 400, "You have already rated this request");

  // FIX: use 'score' field, include 'recipientType' so analytics filters work
  const newRating = await Rating.create({
    helpRequest:   request._id,
    ratedBy:       req.user.id,
    ratedTo:       recipientUserId,
    recipientType,
    score,
    comment:       comment || null,
  });

  // Update volunteer — addRating() recalculates averageRating inline
  if (recipientType === "Volunteer") {
    volunteerProfile.addRating(req.user.id, request._id, score, comment || "");
    await volunteerProfile.save();

    // FIX: trigger scoring service so reputationScore stays in sync
    ScoringService.recalculate(volunteerProfile._id).catch((err) =>
      console.error("Score recalculation failed:", err.message)
    );
  }

  // Update provider — pull fresh average from Rating collection
  if (recipientType === "Provider") {
    const providerRatings        = await Rating.getAverageScore(recipientUserId, "Provider");
    providerProfile.averageRating    = Number((providerRatings.averageScore || 0).toFixed(2));
    providerProfile.totalRatings     = providerRatings.totalRatings || 0;
    providerProfile.credibilityScore = getProviderCredibilityScore(
      providerProfile.averageRating,
      providerProfile.totalRatings
    );
    await providerProfile.save();
  }

  return sendSuccess(res, 201, "Rating submitted successfully", newRating);
});

// ─────────────────────────────────────────
// GET ALL REQUESTS (ADMIN)
// GET /api/requests
// ─────────────────────────────────────────
export const getAllRequests = asyncHandler(async (req, res) => {
  const {
    status, emergencyType,
    page = 1, limit = 10,
    startDate, endDate,
  } = req.query;

  const filter = {};
  if (status)        filter.status        = status;
  if (emergencyType) filter.emergencyType = emergencyType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("requesterId", "name email phone")
      .populate("assignedTo"),
    HelpRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, "All requests fetched successfully", requests, {
    total,
    page:  Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// DELETE REQUEST (ADMIN)
// DELETE /api/requests/:id
// ─────────────────────────────────────────
export const deleteRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);

  if (!request) return sendError(res, 404, "Request not found");

  await Match.deleteMany({ requestId: request._id });
  await HelpRequest.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, "Request and related matches deleted successfully");
});