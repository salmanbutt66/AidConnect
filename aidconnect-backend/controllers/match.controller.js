// controllers/match.controller.js
// Handles all match-related operations for AidConnect
//
// ENDPOINTS HANDLED:
//   GET /api/matches/request/:id  → getRequestMatches (admin/volunteer)
//   PUT /api/matches/:id/decline  → declineMatch (volunteer)
//   GET /api/matches/my           → getMyMatches (volunteer)

const Match = require("../models/Match.model");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError, sendPaginated } = require("../utils/apiResponse");
const { handleVolunteerResponse } = require("../services/matching.service");

// ─────────────────────────────────────────
// GET REQUEST MATCHES
// GET /api/matches/request/:id
// Access: Admin or Volunteer
// Returns all matches for a specific request
// Shows who was notified, who accepted, who declined
// ─────────────────────────────────────────
const getRequestMatches = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const matches = await Match.find({ requestId: id })
    .populate({
      path: "matchedTo",
      select: "name phone bloodGroup reliabilityScore organizationName serviceType",
    })
    .populate({
      path: "requestId",
      select: "emergencyType urgencyLevel status postedAt",
    })
    .sort({ matchScore: -1 });          // best match first

  if (!matches || matches.length === 0) {
    return sendError(res, 404, "No matches found for this request");
  }

  // ── SUMMARY STATS ──────────────────────
  // Quick summary of match statuses
  const summary = {
    total: matches.length,
    notified: matches.filter((m) => m.status === "notified").length,
    accepted: matches.filter((m) => m.status === "accepted").length,
    declined: matches.filter((m) => m.status === "declined").length,
    expired:  matches.filter((m) => m.status === "expired").length,
  };

  return sendSuccess(res, 200, "Request matches fetched successfully", {
    matches,
    summary,
  });
});

// ─────────────────────────────────────────
// DECLINE MATCH
// PUT /api/matches/:id/decline
// Access: Volunteer only
// Volunteer declines a match notification
// ─────────────────────────────────────────
const declineMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use matching service to handle the response
  // This updates match status and handles side effects
  const match = await handleVolunteerResponse(
    id,
    req.user._id,
    "declined"
  );

  return sendSuccess(res, 200, "Match declined successfully", match);
});

// ─────────────────────────────────────────
// GET MY MATCHES
// GET /api/matches/my
// Access: Volunteer only
// Returns all match notifications for
// the logged in volunteer
// Volunteer sees this on their dashboard
// ─────────────────────────────────────────
const getMyMatches = asyncHandler(async (req, res) => {
  const {
    status,
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter
  const filter = {
    matchedTo: req.user._id,           // only this volunteer's matches
  };

  // Optional status filter
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .sort({ notifiedAt: -1 })         // most recent first
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "requestId",
        select: "emergencyType urgencyLevel status description location address postedAt requesterId",
        populate: {
          path: "requesterId",
          select: "name phone",         // requester contact details
        },
      }),

    Match.countDocuments(filter),
  ]);

  return sendPaginated(
    res,
    "Your match notifications fetched successfully",
    matches,
    {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    }
  );
});

module.exports = {
  getRequestMatches,
  declineMatch,
  getMyMatches,
};