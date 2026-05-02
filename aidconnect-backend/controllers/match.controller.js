// controllers/match.controller.js
import Match from "../models/Match.model.js";
import Volunteer from "../models/Volunteer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { handleVolunteerResponse } from "../services/matching.service.js";

// ─────────────────────────────────────────
// GET REQUEST MATCHES
// GET /api/matches/request/:id
// ─────────────────────────────────────────
export const getRequestMatches = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const matches = await Match.find({ requestId: id })
    .populate({
      path: "matchedTo",
      select: "name phone bloodGroup reputationScore organizationName serviceType",
    })
    .populate({
      path: "requestId",
      select: "emergencyType urgencyLevel status postedAt city",
    })
    .sort({ matchScore: -1 });

  if (!matches || matches.length === 0) {
    return sendError(res, 404, "No matches found for this request");
  }

  const summary = {
    total:    matches.length,
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
// ─────────────────────────────────────────
export const declineMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const match = await handleVolunteerResponse(id, req.user.id, "declined");

  return sendSuccess(res, 200, "Match declined successfully", match);
});

// ─────────────────────────────────────────
// GET MY MATCHES
// GET /api/matches/my
// FIX: was filtering by matchedTo: req.user.id (User _id) but
//      matchedTo stores the Volunteer profile _id. Resolve the
//      profile first, then filter by profile._id.
//      Also added city to the requestId populate select so the
//      frontend can display which city the request is from.
// ─────────────────────────────────────────
export const getMyMatches = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const volunteerProfile = await Volunteer.findOne({ user: req.user.id })
    .select("_id")
    .lean();

  if (!volunteerProfile) {
    return sendError(res, 404, "Volunteer profile not found");
  }

  const filter = { matchedTo: volunteerProfile._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .sort({ notifiedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "requestId",
        select: "emergencyType urgencyLevel status description location address city postedAt requesterId",
        populate: {
          path: "requesterId",
          select: "name phone",
        },
      }),
    Match.countDocuments(filter),
  ]);

  return sendPaginated(res, "Your match notifications fetched successfully", matches, {
    total,
    page:  Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});