  // services/matching.service.js
  import Match from "../models/Match.model.js";
  import Volunteer from "../models/Volunteer.model.js";
  import Provider from "../models/Provider.model.js";
  import User from "../models/User.model.js";
  import HelpRequest from "../models/HelpRequest.model.js";
  import { createNotification } from "./notification.service.js";

  // ─────────────────────────────────────────
  // FIND AND CREATE MATCHES
  // Entry point called after a request is created
  // ─────────────────────────────────────────
  const findAndCreateMatches = async (request) => {
    try {
      const candidates = await findCandidatesByCity(request);

      if (candidates.length === 0) {
        console.log(
          `[Matching] No candidates found for request ${request._id} in city: ${request.city || "unknown"}`
        );
        return [];
      }

      const scoredCandidates = scoreCandidates(candidates);
      const topMatches       = scoredCandidates.slice(0, 5);
      const createdMatches   = await createMatchDocuments(topMatches, request);

      console.log(`[Matching] ✅ Created ${createdMatches.length} matches for request ${request._id}`);
      return createdMatches;
    } catch (error) {
      console.error("[Matching] Engine error:", error.message);
      throw error;
    }
  };

  // ─────────────────────────────────────────
  // FIND CANDIDATES BY CITY
  // Queries both volunteers and providers whose city matches the request city.
  //
  // FIX: provider query previously used:
  //   $or: [{ "location.city": cityRegex }, { address: cityRegex }]
  // Provider.model no longer stores city in location.city — it has a flat
  // top-level `city` field. The old query never matched any provider after
  // the schema update, silently producing zero provider candidates.
  // Fixed to: { city: cityRegex }
  // ─────────────────────────────────────────
  const findCandidatesByCity = async (request) => {
    const requestCity = request.city?.trim();

    if (!requestCity) {
      console.log(`[Matching] Request ${request._id} has no city — cannot match`);
      return [];
    }

    const cityRegex = new RegExp(`^${requestCity}$`, "i");

    let volunteers = [];
    let providers  = [];

    // ── Volunteer candidates ────────────────────────────────────────────────
    try {
      const volunteerQuery = {
        isAvailable:        true,
        isApproved:         true,
        isSuspended:        { $ne: true },
        "serviceArea.city": cityRegex,
      };

      // Blood requests: only match volunteers with a compatible blood group
      if (request.emergencyType === "blood" && request.bloodGroupNeeded) {
        const compatibleGroups  = getCompatibleBloodGroups(request.bloodGroupNeeded);
        const compatibleUsers   = await User.find({
          role:       "volunteer",
          isActive:   true,
          bloodGroup: { $in: compatibleGroups },
        }).select("_id");

        const compatibleUserIds = compatibleUsers.map((u) => u._id);

        if (compatibleUserIds.length === 0) {
          console.log(
            `[Matching] No blood-compatible volunteers for group ${request.bloodGroupNeeded}`
          );
        } else {
          volunteerQuery.user = { $in: compatibleUserIds };
        }
      }

      volunteers = await Volunteer.find(volunteerQuery)
        .populate("user", "name phone bloodGroup")
        .sort({ reputationScore: -1 });

      // Keep matching practical: if a volunteer selected emergency types,
      // only match requests that they opted into. Empty list means "any type".
      volunteers = volunteers.filter((v) => {
        if (!Array.isArray(v.emergencyTypes) || v.emergencyTypes.length === 0) {
          return true;
        }
        return v.emergencyTypes.includes(request.emergencyType);
      });

    } catch (error) {
      console.error("[Matching] Error finding volunteers:", error.message);
    }

    // ── Provider candidates ─────────────────────────────────────────────────
    // FIX: query the flat `city` field instead of the nested location.city
    // or address fields. Provider.model stores city as a top-level string.
    try {
      providers = await Provider.find({
        isAvailable: true,
        isVerified:  true,
        serviceType: getRelevantProviderTypes(request.emergencyType),
        city:        cityRegex,   // ← FIX: was $or[location.city, address]
      });
    } catch (error) {
      console.error("[Matching] Error finding providers:", error.message);
    }

    // ── Format results into unified candidate shape ─────────────────────────
    const formattedVolunteers = volunteers.map((v) => ({
      _id:              v._id,
      userId:           v.user._id,
      type:             "Volunteer",
      reliabilityScore: v.reputationScore || 50,
      bloodGroup:       v.user?.bloodGroup,
      name:             v.user?.name,
      phone:            v.user?.phone,
      city:             v.serviceArea?.city,
    }));

    const formattedProviders = providers.map((p) => ({
      _id:              p._id,
      userId:           p.userId,
      type:             "Provider",
      // Providers start with a base score of 70; credibilityScore (0-100)
      // maps to the same 0-100 range — use it directly if available
      reliabilityScore: p.credibilityScore ?? 70,
      name:             p.organizationName,
      phone:            p.contactNumber,
      city:             p.city || requestCity,
    }));

    console.log(
      `[Matching] Found ${formattedVolunteers.length} volunteers, ` +
      `${formattedProviders.length} providers in ${requestCity}`
    );

    return [...formattedVolunteers, ...formattedProviders];
  };

  // ─────────────────────────────────────────
  // SCORE CANDIDATES
  // Simple reliability-based sort.
  // Distance is 0 for all city-matched candidates (no GPS required).
  // ─────────────────────────────────────────
  const scoreCandidates = (candidates) => {
    return candidates
      .map((candidate) => ({
        ...candidate,
        distanceKm: 0,
        matchScore: candidate.reliabilityScore || 50,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  // ─────────────────────────────────────────
  // CREATE MATCH DOCUMENTS + NOTIFY
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
          `[Matching] Failed to create match for candidate ${candidate._id}:`,
          error.message
        );
      }
    }

    return createdMatches;
  };

  // ─────────────────────────────────────────
  // HANDLE VOLUNTEER RESPONSE
  // Accepts or declines a match on behalf of a volunteer.
  //
  // FIX (preserved from earlier): match.matchedTo is the Volunteer profile _id,
  // not the User _id. Resolve the volunteer profile first, then compare correctly.
  // ─────────────────────────────────────────
  const handleVolunteerResponse = async (matchId, userId, action) => {
    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found");

    // Resolve Volunteer profile from User _id
    const volunteerProfile = await Volunteer.findOne({ user: userId });
    if (!volunteerProfile) throw new Error("Volunteer profile not found");

    // match.matchedTo holds the Volunteer profile _id — compare correctly
    if (match.matchedTo.toString() !== volunteerProfile._id.toString()) {
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
      if (!request)                    throw new Error("Request not found");
      if (request.status !== "posted") throw new Error("Request is no longer available");

      request.status       = "accepted";
      request.assignedTo   = match.matchedTo;
      request.assignedType = match.matchedType;
      request.acceptedAt   = new Date();
      request.responseTime = Math.round((request.acceptedAt - request.postedAt) / 1000 / 60);
      await request.save();

      // Lock volunteer so they don't receive further matches
      volunteerProfile.currentRequestId = request._id;
      volunteerProfile.isAvailable      = false;
      volunteerProfile.totalAccepted    = (volunteerProfile.totalAccepted || 0) + 1;
      await volunteerProfile.save();

      // Expire all other pending matches for this request
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
  // PROVIDER TYPE → EMERGENCY TYPE MAPPING
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

  export {
    findAndCreateMatches,
    handleVolunteerResponse,
    getCompatibleBloodGroups,
  };