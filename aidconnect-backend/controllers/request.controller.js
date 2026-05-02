// controllers/request.controller.js
import HelpRequest from "../models/HelpRequest.model.js";
import Match from "../models/Match.model.js";
import Rating from "../models/Rating.model.js";
import Volunteer from "../models/Volunteer.model.js";
import Provider from "../models/Provider.model.js";
import User from "../models/User.model.js";
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
    longitude, latitude, address, city,
    bloodGroupNeeded, proofImage,
  } = req.body;

  if (!emergencyType || !urgencyLevel || !description) {
    return sendError(res, 400, "Emergency type, urgency level and description are required");
  }

  if (!city || !city.trim()) {
    return sendError(res, 400, "City is required so we can find nearby responders");
  }

  if (emergencyType === "blood" && !bloodGroupNeeded) {
    return sendError(res, 400, "Blood group is required for blood emergency requests");
  }

  let locationGeoPoint = null;
  if (longitude && latitude) {
    if (!isValidCoordinates(Number(longitude), Number(latitude))) {
      return sendError(res, 400, "Coordinates provided but are invalid");
    }
    locationGeoPoint = createGeoPoint(Number(longitude), Number(latitude));
  }

  const request = await HelpRequest.create({
    requesterId:      req.user.id,
    emergencyType,
    urgencyLevel,
    description,
    bloodGroupNeeded: emergencyType === "blood" ? bloodGroupNeeded : null,
    proofImage:       proofImage || null,
    address:          address    || null,
    city:             city.trim(),
    location:         locationGeoPoint,
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
// GET NEARBY REQUESTS (city-based)
// GET /api/requests/nearby
// ─────────────────────────────────────────
export const getNearbyRequests = asyncHandler(async (req, res) => {
  const { emergencyType, page = 1, limit = 10 } = req.query;

  const volunteer = await Volunteer.findOne({ user: req.user.id })
    .select("serviceArea.city isApproved isSuspended isAvailable")
    .exec();

  if (!volunteer) {
    return sendError(res, 404, "Volunteer profile not found");
  }

  if (!volunteer.isApproved) {
    return sendError(res, 403, "Your volunteer account is awaiting admin approval");
  }

  if (volunteer.isSuspended) {
    return sendError(res, 403, "Your volunteer account is currently suspended");
  }

  let volunteerCity = volunteer?.serviceArea?.city?.trim();

  if (!volunteerCity) {
    const user = await User.findById(req.user.id).select("location.city").lean();
    const fallbackCity = user?.location?.city?.trim();
    if (fallbackCity && volunteer) {
      volunteer.serviceArea = volunteer.serviceArea || {};
      volunteer.serviceArea.city = fallbackCity;
      await volunteer.save({ validateBeforeSave: false });
      volunteerCity = fallbackCity;
    }
  }

  if (!volunteerCity) {
    return sendError(
      res, 400,
      "Your city is not set. Please update your volunteer profile with your service area city before browsing requests."
    );
  }

  const cityRegex = new RegExp(`^${volunteerCity.trim()}$`, "i");
  const skip      = (Number(page) - 1) * Number(limit);

  const filter = {
    status: "posted",
    city:   cityRegex,
  };

  if (emergencyType) filter.emergencyType = emergencyType;

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ urgencyScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("requesterId", "name phone"),
    HelpRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, "Requests in your city fetched successfully", requests, {
    total,
    page:  Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
    city:  volunteerCity,
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

  if (request.assignedType === "Provider" && request.assignedTo) {
    await Provider.findByIdAndUpdate(request.assignedTo, { isAvailable: true });
  }

  // FIX: free up the volunteer if they were assigned when user cancels
  if (request.assignedType === "Volunteer" && request.assignedTo) {
    const volunteerProfile = await Volunteer.findById(request.assignedTo);
    if (volunteerProfile) {
      volunteerProfile.freeUp();
      await volunteerProfile.save();
    }
  }

  return sendSuccess(res, 200, "Request cancelled successfully", request);
});

// ─────────────────────────────────────────
// ACCEPT REQUEST (volunteer via match)
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
// Access: assigned volunteer or provider only
//
// FIX: on completion, free the volunteer profile (currentRequestId → null,
// isAvailable → true, totalCompleted += 1) in addition to freeing the provider.
// Previously only providers were freed here — volunteers stayed locked as
// unavailable permanently after their first completed request via this path.
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

  // ── Verify the caller is the assigned responder ──────────────────────────
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

  // ── Validate transition ───────────────────────────────────────────────────
  const allowedNextStatuses = validTransitions[request.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    return sendError(
      res, 400,
      `Cannot transition from "${request.status}" to "${status}". ` +
      `Allowed next status: ${allowedNextStatuses.join(", ") || "none"}`
    );
  }

  // ── Apply transition ──────────────────────────────────────────────────────
  request.status = status;

  if (status === "completed") {
    request.completedAt    = new Date();
    request.resolutionTime = Math.round(
      (request.completedAt - request.postedAt) / 1000 / 60
    );

    // FIX: free provider BEFORE save so a save failure doesn't lock them
    if (request.assignedType === "Provider") {
      await Provider.findByIdAndUpdate(request.assignedTo, { isAvailable: true });
    }

    // FIX: free volunteer — was completely missing from this path.
    // volunteer.controller completeRequest() does this correctly but
    // updateRequestStatus (used by providers AND as a fallback path)
    // never freed the volunteer. Result: volunteer stays locked as
    // unavailable with currentRequestId set forever.
    if (request.assignedType === "Volunteer") {
      const volunteerProfile = await Volunteer.findById(request.assignedTo);
      if (volunteerProfile) {
        volunteerProfile.freeUp();          // currentRequestId → null, isAvailable → true
        volunteerProfile.totalCompleted += 1;
        await volunteerProfile.save();
        ScoringService.recalculate(volunteerProfile._id).catch((err) =>
          console.error("Score recalculation failed:", err.message)
        );
      }
    }

    await notifyRequestCompleted(request.requesterId, request);
  }

  await request.save();

  return sendSuccess(res, 200, `Request status updated to "${status}"`, request);
});

// ─────────────────────────────────────────
// RATE REQUEST
// POST /api/requests/:id/rate
// ─────────────────────────────────────────
export const rateRequest = asyncHandler(async (req, res) => {
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

  const newRating = await Rating.create({
    helpRequest:   request._id,
    ratedBy:       req.user.id,
    ratedTo:       recipientUserId,
    recipientType,
    score,
    comment:       comment || null,
  });

  // ── Update volunteer reputation ───────────────────────────────────────────
  if (recipientType === "Volunteer") {
    volunteerProfile.addRating(req.user.id, request._id, score, comment || "");
    await volunteerProfile.save();

    ScoringService.recalculate(volunteerProfile._id).catch((err) =>
      console.error("Score recalculation failed:", err.message)
    );
  }

  // ── Update provider credibility ───────────────────────────────────────────
  if (recipientType === "Provider") {
    const stats = await Rating.getAverageScore(recipientUserId, "Provider");
    providerProfile.averageRating    = Number((stats.averageScore  || 0).toFixed(2));
    providerProfile.totalRatings     = stats.totalRatings || 0;
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