// services/matching.service.js
import Match from "../models/Match.model.js";
import Volunteer from "../models/Volunteer.model.js";
import Provider from "../models/Provider.model.js";
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import { createNotification } from "./notification.service.js";

// ─────────────────────────────────────────
// MAIN MATCHING FUNCTION
// ─────────────────────────────────────────
const findAndCreateMatches = async (request) => {
  try {
    const candidates = await findCandidatesByCity(request);

    if (candidates.length === 0) {
      console.log(`No candidates found for request ${request._id} in city: ${request.city || "unknown"}`);
      return [];
    }

    const scoredCandidates = scoreCandidates(candidates);
    const topMatches = scoredCandidates.slice(0, 5);
    const createdMatches = await createMatchDocuments(topMatches, request);

    console.log(`✅ Created ${createdMatches.length} matches for request ${request._id}`);

    return createdMatches;
  } catch (error) {
    console.error("Matching engine error:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// STEP 1: FIND CANDIDATES BY CITY
// Replaces the $nearSphere geo query entirely.
// Matches volunteers whose serviceArea.city matches
// the city on the help request (case-insensitive).
// ─────────────────────────────────────────
const findCandidatesByCity = async (request) => {
  const requestCity = request.city;

  if (!requestCity) {
    console.log(`Request ${request._id} has no city — cannot match by city`);
    return [];
  }

  // Case-insensitive exact city match
  const cityRegex = new RegExp(`^${requestCity.trim()}$`, "i");

  let volunteers = [];
  let providers  = [];

  // ── FIND VOLUNTEERS IN SAME CITY ──────
  try {
    let volunteerQuery = {
      isAvailable:        true,
      isApproved:         true,
      isSuspended:        { $ne: true },
      "serviceArea.city": cityRegex,
    };

    // Blood group filter — find compatible user IDs first, then filter volunteers
    if (request.emergencyType === "blood" && request.bloodGroupNeeded) {
      const compatibleGroups = getCompatibleBloodGroups(request.bloodGroupNeeded);

      const compatibleUsers = await User.find({
        role:       "volunteer",
        isActive:   true,
        bloodGroup: { $in: compatibleGroups },
      }).select("_id");

      const compatibleUserIds = compatibleUsers.map((u) => u._id);

      if (compatibleUserIds.length === 0) {
        console.log(`No blood-compatible volunteers for group ${request.bloodGroupNeeded}`);
        return [];
      }

      volunteerQuery.user = { $in: compatibleUserIds };
    }

    volunteers = await Volunteer.find(volunteerQuery)
      .populate("user", "name phone bloodGroup")
      .sort({ reputationScore: -1 }); // highest reputation first within city

  } catch (error) {
    console.error("Error finding volunteers by city:", error.message);
  }

  // ── FIND PROVIDERS IN SAME CITY ───────
  try {
    providers = await Provider.find({
      isAvailable: true,
      isVerified:  true,
      serviceType: getRelevantProviderTypes(request.emergencyType),
      address:     cityRegex,
    });
  } catch (error) {
    console.error("Error finding providers by city:", error.message);
  }

  // ── FORMAT INTO UNIFORM SHAPE ──────────
  const formattedVolunteers = volunteers.map((v) => ({
    _id:              v._id,
    userId:           v.user._id,
    type:             "Volunteer",
    reliabilityScore: v.reputationScore || 50,
    bloodGroup:       v.user.bloodGroup,
    name:             v.user.name,
    phone:            v.user.phone,
    city:             v.serviceArea?.city,
  }));

  const formattedProviders = providers.map((p) => ({
    _id:              p._id,
    userId:           p.userId,
    type:             "Provider",
    reliabilityScore: 70,
    name:             p.organizationName,
    phone:            p.contactNumber,
    city:             requestCity,
  }));

  return [...formattedVolunteers, ...formattedProviders];
};

// ─────────────────────────────────────────
// STEP 2: SCORE EACH CANDIDATE
// Without GPS we score purely on reputation.
// matchScore = reliabilityScore (0–100)
// ─────────────────────────────────────────
const scoreCandidates = (candidates) => {
  const scored = candidates.map((candidate) => ({
    ...candidate,
    distanceKm: 0,
    matchScore:  candidate.reliabilityScore || 50,
  }));

  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

// ─────────────────────────────────────────
// STEP 3: CREATE MATCH DOCUMENTS + NOTIFY
// ─────────────────────────────────────────
const createMatchDocuments = async (topMatches, request) => {
  const createdMatches = [];

  for (const candidate of topMatches) {
    try {
      const match = await Match.create({
        requestId:   request._id,
        matchedTo:   candidate._id,
        matchedType: candidate.type,
        matchScore:  candidate.matchScore,
        distanceKm:  candidate.distanceKm,
        status:      "notified",
        notifiedAt:  new Date(),
      });

      await createNotification({
        recipientId:    candidate.userId,
        type:           "new_request",
        title:          "New Emergency Request in Your City",
        message:        `A ${request.emergencyType} emergency has been reported in ${request.city || "your area"}. Urgency: ${request.urgencyLevel}.`,
        relatedRequest: request._id,
      });

      createdMatches.push(match);
    } catch (error) {
      console.error(
        `Failed to create match for candidate ${candidate._id}:`,
        error.message
      );
    }
  }

  return createdMatches;
};

// ─────────────────────────────────────────
// BLOOD GROUP COMPATIBILITY MATRIX
// ─────────────────────────────────────────
const getCompatibleBloodGroups = (neededGroup) => {
  const compatibility = {
    "A+":  ["A+", "A-", "O+", "O-"],
    "A-":  ["A-", "O-"],
    "B+":  ["B+", "B-", "O+", "O-"],
    "B-":  ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+":  ["O+", "O-"],
    "O-":  ["O-"],
  };

  return compatibility[neededGroup] || [neededGroup];
};

// ─────────────────────────────────────────
// RELEVANT PROVIDER TYPES PER EMERGENCY
// ─────────────────────────────────────────
const getRelevantProviderTypes = (emergencyType) => {
  const mapping = {
    medical:  ["hospital", "ambulance", "ngo"],
    blood:    ["blood_bank", "hospital"],
    accident: ["ambulance", "hospital", "rescue"],
    disaster: ["rescue", "ngo", "ambulance"],
    other:    ["ngo", "hospital", "rescue"],
  };

  return { $in: mapping[emergencyType] || ["ngo"] };
};

// ─────────────────────────────────────────
// HANDLE VOLUNTEER RESPONSE (accept/decline)
// ─────────────────────────────────────────
const handleVolunteerResponse = async (matchId, volunteerId, action) => {
  const match = await Match.findById(matchId);
  if (!match) throw new Error("Match not found");

  if (match.matchedTo.toString() !== volunteerId.toString()) {
    throw new Error("Unauthorized — this match does not belong to you");
  }

  if (match.status !== "notified") {
    throw new Error("This match has already been responded to");
  }

  match.status      = action;
  match.respondedAt = new Date();
  await match.save();

  if (action === "accepted") {
    const request = await HelpRequest.findById(match.requestId);

    if (!request) throw new Error("Request not found");
    if (request.status !== "posted") throw new Error("Request is no longer available");

    request.status       = "accepted";
    request.assignedTo   = match.matchedTo;
    request.assignedType = match.matchedType;
    request.acceptedAt   = new Date();

    const diffMs         = request.acceptedAt - request.postedAt;
    request.responseTime = Math.round(diffMs / 1000 / 60);

    await request.save();

    // Expire all other notified matches for this request
    await Match.updateMany(
      { requestId: match.requestId, _id: { $ne: matchId }, status: "notified" },
      { status: "expired" }
    );

    await createNotification({
      recipientId:    request.requesterId,
      type:           "request_accepted",
      title:          "Help is on the way!",
      message:        `Your ${request.emergencyType} request has been accepted. A responder is on their way.`,
      relatedRequest: request._id,
    });
  }

  return match;
};

export {
  findAndCreateMatches,
  handleVolunteerResponse,
  getCompatibleBloodGroups,
};