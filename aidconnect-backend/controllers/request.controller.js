// controllers/request.controller.js
// Handles all help request operations for AidConnect
//
// ENDPOINTS HANDLED:
//   POST   /api/requests              → createRequest
//   GET    /api/requests/my           → getMyRequests
//   GET    /api/requests/nearby       → getNearbyRequests
//   GET    /api/requests/:id          → getRequestById
//   PUT    /api/requests/:id/cancel   → cancelRequest
//   PUT    /api/requests/:id/accept   → acceptRequest
//   PUT    /api/requests/:id/status   → updateRequestStatus
//   POST   /api/requests/:id/rate     → rateRequest
//   GET    /api/requests              → getAllRequests (admin)
//   DELETE /api/requests/:id          → deleteRequest (admin)

const HelpRequest = require("../models/HelpRequest.model");
const Match = require("../models/Match.model");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError, sendPaginated } = require("../utils/apiResponse");
const { createGeoPoint, isValidCoordinates } = require("../utils/geoHelper");
const { findAndCreateMatches } = require("../services/matching.service");
const {
  notifyRequestCompleted,
  notifyRequestCancelled,
} = require("../services/notification.service");

// ─────────────────────────────────────────
// CREATE REQUEST
// POST /api/requests
// Access: User only
// Flow:
//   1. Validate input
//   2. Create request in DB
//   3. Trigger matching engine
//   4. Return created request
// ─────────────────────────────────────────
const createRequest = asyncHandler(async (req, res) => {
  const {
    emergencyType,
    urgencyLevel,
    description,
    longitude,
    latitude,
    address,
    bloodGroupNeeded,
    proofImage,
  } = req.body;

  // ── VALIDATE REQUIRED FIELDS ───────────
  if (!emergencyType || !urgencyLevel || !description) {
    return sendError(res, 400, "Emergency type, urgency level and description are required");
  }

  if (!longitude || !latitude) {
    return sendError(res, 400, "Location coordinates are required");
  }

  // ── VALIDATE COORDINATES ───────────────
  if (!isValidCoordinates(Number(longitude), Number(latitude))) {
    return sendError(res, 400, "Invalid coordinates provided");
  }

  // ── VALIDATE BLOOD GROUP FOR BLOOD REQUESTS ──
  if (emergencyType === "blood" && !bloodGroupNeeded) {
    return sendError(res, 400, "Blood group is required for blood emergency requests");
  }

  // ── CREATE THE REQUEST ─────────────────
  const request = await HelpRequest.create({
    requesterId: req.user._id,        // from auth middleware
    emergencyType,
    urgencyLevel,
    description,
    bloodGroupNeeded: emergencyType === "blood" ? bloodGroupNeeded : null,
    proofImage: proofImage || null,
    address: address || null,
    location: createGeoPoint(Number(longitude), Number(latitude)),
    status: "posted",
    postedAt: new Date(),
  });

  // ── TRIGGER MATCHING ENGINE ────────────
  // Run matching in background — don't await
  // So user gets response immediately
  // Matching happens asynchronously
  findAndCreateMatches(request).catch((err) => {
    console.error("Matching engine failed for request:", request._id, err.message);
  });

  return sendSuccess(res, 201, "Help request posted successfully. Finding nearby responders...", request);
});

// ─────────────────────────────────────────
// GET MY REQUESTS
// GET /api/requests/my
// Access: User only
// Returns all requests posted by logged in user
// ─────────────────────────────────────────
const getMyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = { requesterId: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .sort({ createdAt: -1 })          // newest first
      .skip(skip)
      .limit(Number(limit))
      .populate("assignedTo", "name phone"), // get responder details

    HelpRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, "Your requests fetched successfully", requests, {
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// GET NEARBY REQUESTS
// GET /api/requests/nearby
// Access: Volunteer only
// Returns open requests near volunteer's location
// ─────────────────────────────────────────
const getNearbyRequests = asyncHandler(async (req, res) => {
  const {
    longitude,
    latitude,
    radius = 10,                        // default 10km
    emergencyType,
    page = 1,
    limit = 10,
  } = req.query;

  if (!longitude || !latitude) {
    return sendError(res, 400, "Your location coordinates are required");
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Build filter
  const filter = {
    status: "posted",                   // only open requests
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: Number(radius) * 1000, // convert km to meters
      },
    },
  };

  // Optional filter by emergency type
  if (emergencyType) filter.emergencyType = emergencyType;

  const requests = await HelpRequest.find(filter)
    .sort({ urgencyScore: -1 })         // highest urgency first
    .skip(skip)
    .limit(Number(limit))
    .populate("requesterId", "name phone");

  const total = await HelpRequest.countDocuments({
    status: "posted",
    ...(emergencyType && { emergencyType }),
  });

  return sendPaginated(res, "Nearby requests fetched successfully", requests, {
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// GET REQUEST BY ID
// GET /api/requests/:id
// Access: Private (any logged in user)
// Returns full detail of a single request
// ─────────────────────────────────────────
const getRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate("requesterId", "name phone email")
    .populate("assignedTo");

  if (!request) {
    return sendError(res, 404, "Request not found");
  }

  return sendSuccess(res, 200, "Request fetched successfully", request);
});

// ─────────────────────────────────────────
// CANCEL REQUEST
// PUT /api/requests/:id/cancel
// Access: User only (own requests)
// ─────────────────────────────────────────
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 404, "Request not found");
  }

  // Security: user can only cancel their own requests
  if (request.requesterId.toString() !== req.user._id.toString()) {
    return sendError(res, 403, "You can only cancel your own requests");
  }

  // Can only cancel if not already completed or cancelled
  if (["completed", "cancelled"].includes(request.status)) {
    return sendError(res, 400, `Cannot cancel a request that is already ${request.status}`);
  }

  // Update request
  request.status = "cancelled";
  request.cancelledAt = new Date();
  await request.save();

  // If someone was assigned, notify them
  if (request.assignedTo) {
    await notifyRequestCancelled(request.assignedTo, request);
  }

  // Expire all pending matches for this request
  await Match.updateMany(
    { requestId: request._id, status: "notified" },
    { status: "expired" }
  );

  return sendSuccess(res, 200, "Request cancelled successfully", request);
});

// ─────────────────────────────────────────
// ACCEPT REQUEST
// PUT /api/requests/:id/accept
// Access: Volunteer only
// ─────────────────────────────────────────
const acceptRequest = asyncHandler(async (req, res) => {
  const { matchId } = req.body;

  if (!matchId) {
    return sendError(res, 400, "Match ID is required");
  }

  const { handleVolunteerResponse } = require("../services/matching.service");

  const match = await handleVolunteerResponse(
    matchId,
    req.user._id,
    "accepted"
  );

  return sendSuccess(res, 200, "Request accepted successfully. Please head to the location.", match);
});

// ─────────────────────────────────────────
// UPDATE REQUEST STATUS
// PUT /api/requests/:id/status
// Access: Volunteer or Provider
// Volunteer updates: in_progress → completed
// ─────────────────────────────────────────
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return sendError(res, 400, "Status is required");
  }

  const validTransitions = {
    accepted:    ["in_progress"],
    in_progress: ["completed"],
  };

  const request = await HelpRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 404, "Request not found");
  }

  // Security: only assigned volunteer/provider can update status
  if (request.assignedTo.toString() !== req.user._id.toString()) {
    return sendError(res, 403, "You are not assigned to this request");
  }

  // Validate status transition
  const allowedNextStatuses = validTransitions[request.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    return sendError(
      res,
      400,
      `Cannot transition from ${request.status} to ${status}`
    );
  }

  // Update status
  request.status = status;

  // If completing, record completion time and calculate resolution time
  if (status === "completed") {
    request.completedAt = new Date();
    const diffMs = request.completedAt - request.postedAt;
    request.resolutionTime = Math.round(diffMs / 1000 / 60); // minutes

    // Notify requester
    await notifyRequestCompleted(request.requesterId, request);
  }

  await request.save();

  return sendSuccess(res, 200, `Request status updated to ${status}`, request);
});

// ─────────────────────────────────────────
// RATE REQUEST
// POST /api/requests/:id/rate
// Access: User only (after completion)
// ─────────────────────────────────────────
const rateRequest = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return sendError(res, 400, "Rating must be between 1 and 5");
  }

  const request = await HelpRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 404, "Request not found");
  }

  // Only requester can rate
  if (request.requesterId.toString() !== req.user._id.toString()) {
    return sendError(res, 403, "You can only rate your own requests");
  }

  // Can only rate completed requests
  if (request.status !== "completed") {
    return sendError(res, 400, "You can only rate completed requests");
  }

  if (!request.assignedTo) {
    return sendError(res, 400, "No responder assigned to rate");
  }

  // Create rating using Rating model (Rabia's)
  const Rating = require("../models/Rating.model");

  // Check if already rated
  const existingRating = await Rating.findOne({
    requestId: request._id,
    raterId: req.user._id,
  });

  if (existingRating) {
    return sendError(res, 400, "You have already rated this request");
  }

  const newRating = await Rating.create({
    requestId: request._id,
    raterId: req.user._id,
    ratedId: request.assignedTo,
    ratedType: request.assignedType,
    rating,
    comment: comment || null,
  });

  return sendSuccess(res, 201, "Rating submitted successfully", newRating);
});

// ─────────────────────────────────────────
// GET ALL REQUESTS (ADMIN)
// GET /api/requests
// Access: Admin only
// Supports filtering by status, type, date
// ─────────────────────────────────────────
const getAllRequests = asyncHandler(async (req, res) => {
  const {
    status,
    emergencyType,
    page = 1,
    limit = 10,
    startDate,
    endDate,
  } = req.query;

  // Build filter dynamically
  const filter = {};
  if (status) filter.status = status;
  if (emergencyType) filter.emergencyType = emergencyType;

  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
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
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─────────────────────────────────────────
// DELETE REQUEST (ADMIN)
// DELETE /api/requests/:id
// Access: Admin only
// ─────────────────────────────────────────
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 404, "Request not found");
  }

  // Delete all related matches
  await Match.deleteMany({ requestId: request._id });

  // Delete the request
  await HelpRequest.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, "Request and related matches deleted successfully");
});

module.exports = {
  createRequest,
  getMyRequests,
  getNearbyRequests,
  getRequestById,
  cancelRequest,
  acceptRequest,
  updateRequestStatus,
  rateRequest,
  getAllRequests,
  deleteRequest,
};