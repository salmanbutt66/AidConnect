// services/matching.service.js
import Match from "../models/Match.model.js";
import Volunteer from "../models/Volunteer.model.js";
import Provider from "../models/Provider.model.js";
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import { calculateDistance, getDistanceScore } from "../utils/geoHelper.js";
import { createNotification } from "./notification.service.js";

// ─────────────────────────────────────────
// MAIN MATCHING FUNCTION
// ─────────────────────────────────────────
const findAndCreateMatches = async (request) => {
  try {
    const candidates = await findNearbyCandidates(request);

    if (candidates.length === 0) {
      console.log(`No candidates found for request ${request._id}`);
      return [];
    }

    const scoredCandidates = scoreCandidates(candidates, request);
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
// STEP 1: FIND NEARBY CANDIDATES
// ─────────────────────────────────────────
const findNearbyCandidates = async (request) => {
  const [longitude, latitude] = request.location.coordinates;
  const searchRadiusMeters = 10000;

  let volunteers = [];
  let providers = [];

  // ── FIND NEARBY VOLUNTEERS ─────────────
  try {
    const nearbyUsers = await User.find({
      role: "volunteer",
      isActive: true,
      isVerified: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: searchRadiusMeters,
        },
      },
    }).select("_id location");

    if (nearbyUsers.length > 0) {
      const userIds = nearbyUsers.map((u) => u._id);

      let volunteerQuery = {
        user: { $in: userIds },
        isAvailable: true,
        isApproved: true,
      };

      if (request.emergencyType === "blood" && request.bloodGroupNeeded) {
        const compatibleGroups = getCompatibleBloodGroups(request.bloodGroupNeeded);
        volunteerQuery["user.bloodGroup"] = { $in: compatibleGroups };
      }

      volunteers = await Volunteer.find(volunteerQuery).populate(
        "user",
        "name phone location bloodGroup"
      );
    }
  } catch (error) {
    console.error("Error finding volunteers:", error.message);
  }

  // ── FIND NEARBY PROVIDERS ──────────────
  try {
    providers = await Provider.find({
      isAvailable: true,
      isVerified: true,
      serviceType: getRelevantProviderTypes(request.emergencyType),
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: searchRadiusMeters,
        },
      },
    });
  } catch (error) {
    console.error("Error finding providers:", error.message);
  }

  // ── COMBINE AND FORMAT CANDIDATES ──────
  const formattedVolunteers = volunteers.map((v) => ({
    _id: v._id,
    userId: v.user._id,
    type: "Volunteer",
    location: v.location,
    reliabilityScore: v.reputationScore || 50,
    bloodGroup: v.user.bloodGroup,
    name: v.user.name,
    phone: v.user.phone,
  }));

  const formattedProviders = providers.map((p) => ({
    _id: p._id,
    userId: p.userId,
    type: "Provider",
    location: p.location,
    reliabilityScore: 70,
    name: p.organizationName,
    phone: p.contactNumber,
  }));

  return [...formattedVolunteers, ...formattedProviders];
};

// ─────────────────────────────────────────
// STEP 2: SCORE EACH CANDIDATE
// matchScore = (distanceScore × 0.6) + (reliabilityScore × 0.4)
// ─────────────────────────────────────────
const scoreCandidates = (candidates, request) => {
  const requestCoords = request.location.coordinates;

  const scored = candidates.map((candidate) => {
    const distanceKm = calculateDistance(
      requestCoords,
      candidate.location.coordinates
    );

    const distanceScore = getDistanceScore(distanceKm, 10);
    const reliabilityScore = candidate.reliabilityScore || 50;
    const matchScore = Math.round(distanceScore * 0.6 + reliabilityScore * 0.4);

    return {
      ...candidate,
      distanceKm,
      distanceScore,
      matchScore,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

// ─────────────────────────────────────────
// STEP 3: CREATE MATCH DOCUMENTS
// ─────────────────────────────────────────
const createMatchDocuments = async (topMatches, request) => {
  const createdMatches = [];

  for (const candidate of topMatches) {
    try {
      const match = await Match.create({
        requestId: request._id,
        matchedTo: candidate._id,
        matchedType: candidate.type,
        matchScore: candidate.matchScore,
        distanceKm: candidate.distanceKm,
        status: "notified",
        notifiedAt: new Date(),
      });

      await createNotification({
        recipientId: candidate.userId,
        type: "new_request",
        title: "New Emergency Request Nearby",
        message: `A ${request.emergencyType} emergency has been reported ${candidate.distanceKm}km from you. Urgency: ${request.urgencyLevel}.`,
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
// BLOOD GROUP COMPATIBILITY
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
// RELEVANT PROVIDER TYPES
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
// HANDLE VOLUNTEER RESPONSE
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

  match.status = action;
  match.respondedAt = new Date();
  await match.save();

  if (action === "accepted") {
    const request = await HelpRequest.findById(match.requestId);

    if (!request) throw new Error("Request not found");
    if (request.status !== "posted") throw new Error("Request is no longer available");

    request.status = "accepted";
    request.assignedTo = match.matchedTo;
    request.assignedType = match.matchedType;
    request.acceptedAt = new Date();

    const diffMs = request.acceptedAt - request.postedAt;
    request.responseTime = Math.round(diffMs / 1000 / 60);

    await request.save();

    await Match.updateMany(
      {
        requestId: match.requestId,
        _id: { $ne: matchId },
        status: "notified",
      },
      { status: "expired" }
    );

    await createNotification({
      recipientId: request.requesterId,
      type: "request_accepted",
      title: "Help is on the way!",
      message: `Your ${request.emergencyType} request has been accepted. A responder is on their way.`,
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