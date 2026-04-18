// services/matching.service.js
// The core brain of AidConnect
//
// WHAT IT DOES:
// When a user posts a help request, this service:
//   1. Finds all available volunteers/providers nearby
//   2. Filters by compatibility (blood group, service type)
//   3. Scores each match (distance + reliability)
//   4. Takes top 5 matches
//   5. Creates Match documents for each
//   6. Triggers notifications for each
//
// THIS IS YOUR ADBMS SHOWCASE:
//   ✅ MongoDB geo queries ($nearSphere)
//   ✅ Aggregation pipeline for scoring
//   ✅ Compound filtering
//   ✅ Dynamic matching algorithm

const Match = require("../models/Match.model");
const { calculateDistance, getDistanceScore } = require("../utils/geoHelper");
const { createNotification } = require("./notification.service");

// ─────────────────────────────────────────
// MAIN MATCHING FUNCTION
// Called by request.controller.js after
// a new help request is created
// Parameters:
//   request → the newly created HelpRequest document
// Returns: array of created Match documents
// ─────────────────────────────────────────
const findAndCreateMatches = async (request) => {
  try {
    // Step 1: Find all nearby candidates
    const candidates = await findNearbyCandidates(request);

    if (candidates.length === 0) {
      console.log(`No candidates found for request ${request._id}`);
      return [];
    }

    // Step 2: Score each candidate
    const scoredCandidates = scoreCandidates(candidates, request);

    // Step 3: Take top 5 matches only
    const topMatches = scoredCandidates.slice(0, 5);

    // Step 4: Create Match documents and notifications
    const createdMatches = await createMatchDocuments(topMatches, request);

    console.log(
      `✅ Created ${createdMatches.length} matches for request ${request._id}`
    );

    return createdMatches;
  } catch (error) {
    console.error("Matching engine error:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// STEP 1: FIND NEARBY CANDIDATES
// Uses MongoDB $nearSphere geo query to find
// volunteers and providers within radius
// ─────────────────────────────────────────
const findNearbyCandidates = async (request) => {
  // We need User model to access location
  // Volunteer and Provider models are from team members
  // We require them here to avoid circular dependencies
  const Volunteer = require("../models/Volunteer.model");
  const Provider = require("../models/Provider.model");
  const User = require("../models/User.model");

  const [longitude, latitude] = request.location.coordinates;
  const searchRadiusMeters = 10000; // 10km default radius

  let volunteers = [];
  let providers = [];

  // ── FIND NEARBY VOLUNTEERS ─────────────
  try {
    // Find users with role "volunteer" near the request location
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

    // Get the volunteer profiles for these users
    if (nearbyUsers.length > 0) {
      const userIds = nearbyUsers.map((u) => u._id);

      let volunteerQuery = {
        userId: { $in: userIds },
        isAvailable: true,
      };

      // If blood request, filter by blood group compatibility
      if (
        request.emergencyType === "blood" &&
        request.bloodGroupNeeded
      ) {
        const compatibleGroups = getCompatibleBloodGroups(
          request.bloodGroupNeeded
        );
        volunteerQuery.bloodGroup = { $in: compatibleGroups };
      }

      volunteers = await Volunteer.find(volunteerQuery).populate(
        "userId",
        "name phone location"
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
      // Match provider service type to emergency type
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
    userId: v.userId._id,
    type: "Volunteer",
    location: v.userId.location,
    reliabilityScore: v.reliabilityScore || 50,
    bloodGroup: v.bloodGroup,
    name: v.userId.name,
    phone: v.userId.phone,
  }));

  const formattedProviders = providers.map((p) => ({
    _id: p._id,
    userId: p.userId,
    type: "Provider",
    location: p.location,
    reliabilityScore: 70,           // providers get default score
    name: p.organizationName,
    phone: p.contactNumber,
  }));

  return [...formattedVolunteers, ...formattedProviders];
};

// ─────────────────────────────────────────
// STEP 2: SCORE EACH CANDIDATE
// Combines distance score + reliability score
// into a single matchScore (0-100)
//
// SCORING FORMULA:
//   matchScore = (distanceScore × 0.6) + (reliabilityScore × 0.4)
//   Distance is weighted more (60%) than reliability (40%)
//   Because proximity is most critical in emergencies
// ─────────────────────────────────────────
const scoreCandidates = (candidates, request) => {
  const requestCoords = request.location.coordinates;

  const scored = candidates.map((candidate) => {
    // Calculate actual distance in km
    const distanceKm = calculateDistance(
      requestCoords,
      candidate.location.coordinates
    );

    // Convert distance to score (closer = higher score)
    const distanceScore = getDistanceScore(distanceKm, 10);

    // Get reliability score (0-100)
    const reliabilityScore = candidate.reliabilityScore || 50;

    // Weighted final score
    // 60% distance + 40% reliability
    const matchScore = Math.round(
      distanceScore * 0.6 + reliabilityScore * 0.4
    );

    return {
      ...candidate,
      distanceKm,
      distanceScore,
      matchScore,
    };
  });

  // Sort by matchScore descending (best match first)
  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

// ─────────────────────────────────────────
// STEP 3: CREATE MATCH DOCUMENTS
// Creates a Match record for each top candidate
// Also triggers a notification for each
// ─────────────────────────────────────────
const createMatchDocuments = async (topMatches, request) => {
  const createdMatches = [];

  for (const candidate of topMatches) {
    try {
      // Create the Match document
      const match = await Match.create({
        requestId: request._id,
        matchedTo: candidate._id,
        matchedType: candidate.type,
        matchScore: candidate.matchScore,
        distanceKm: candidate.distanceKm,
        status: "notified",
        notifiedAt: new Date(),
      });

      // Create notification for this candidate
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
      // Continue with next candidate even if one fails
    }
  }

  return createdMatches;
};

// ─────────────────────────────────────────
// BLOOD GROUP COMPATIBILITY
// Returns array of blood groups that can
// donate to the needed blood group
// Medical compatibility rules:
//   O- is universal donor
//   AB+ is universal recipient
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
// Maps emergency type to relevant
// service provider types
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
// Called when a volunteer accepts or declines
// Updates the match status and request if accepted
// ─────────────────────────────────────────
const handleVolunteerResponse = async (matchId, volunteerId, action) => {
  const HelpRequest = require("../models/HelpRequest.model");

  // Find the match
  const match = await Match.findById(matchId);
  if (!match) throw new Error("Match not found");

  // Verify this volunteer owns this match
  if (match.matchedTo.toString() !== volunteerId.toString()) {
    throw new Error("Unauthorized — this match does not belong to you");
  }

  // Check match is still pending
  if (match.status !== "notified") {
    throw new Error("This match has already been responded to");
  }

  // Update match status
  match.status = action;              // "accepted" or "declined"
  match.respondedAt = new Date();     // pre-save calculates responseTimeMinutes
  await match.save();

  // If accepted, update the help request
  if (action === "accepted") {
    const request = await HelpRequest.findById(match.requestId);

    if (!request) throw new Error("Request not found");
    if (request.status !== "posted") throw new Error("Request is no longer available");

    // Update request status and assignment
    request.status = "accepted";
    request.assignedTo = match.matchedTo;
    request.assignedType = match.matchedType;
    request.acceptedAt = new Date();

    // Calculate response time in minutes
    const diffMs = request.acceptedAt - request.postedAt;
    request.responseTime = Math.round(diffMs / 1000 / 60);

    await request.save();

    // Expire all other pending matches for this request
    await Match.updateMany(
      {
        requestId: match.requestId,
        _id: { $ne: matchId },        // all matches except this one
        status: "notified",
      },
      {
        status: "expired",
      }
    );

    // Notify the requester that help is on the way
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

module.exports = {
  findAndCreateMatches,
  handleVolunteerResponse,
  getCompatibleBloodGroups,
};