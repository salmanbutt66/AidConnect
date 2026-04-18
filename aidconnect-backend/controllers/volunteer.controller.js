// controllers/volunteer.controller.js

import Volunteer from "../models/Volunteer.model.js";
import User from "../models/User.model.js";
import ScoringService from "../services/scoring.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/profile
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyVolunteerProfile = async (req, res, next) => {
  try {
    const profile = await Volunteer.findOne({ user: req.user.id })
      .populate("user", "name email phone bloodGroup location profilePicture")
      .populate("currentRequestId", "title emergencyType status urgencyLevel");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/profile
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateVolunteerProfile = async (req, res, next) => {
  try {
    const {
      bio,
      skills,
      emergencyTypes,
      serviceArea,
      availabilitySchedule,
      canDonatBlood,
      lastDonationDate,
      cnic,
      radiusKm,
    } = req.body;

    const profile = await Volunteer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    // Whitelist updates
    if (bio !== undefined) profile.bio = bio;
    if (skills) profile.skills = skills;
    if (emergencyTypes) profile.emergencyTypes = emergencyTypes;
    if (availabilitySchedule) profile.availabilitySchedule = availabilitySchedule;
    if (canDonatBlood !== undefined) profile.canDonatBlood = canDonatBlood;
    if (lastDonationDate) profile.lastDonationDate = lastDonationDate;
    if (cnic) profile.cnic = cnic;

    // Update service area fields individually to avoid wiping coords
    if (serviceArea) {
      if (serviceArea.city) profile.serviceArea.city = serviceArea.city;
      if (serviceArea.area) profile.serviceArea.area = serviceArea.area;
      if (serviceArea.coordinates) profile.serviceArea.coordinates = serviceArea.coordinates;
      if (radiusKm) profile.serviceArea.radiusKm = radiusKm;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Volunteer profile updated successfully",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/availability
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const toggleAvailability = async (req, res, next) => {
  try {
    const profile = await Volunteer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    if (!profile.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your volunteer profile is pending admin approval",
      });
    }

    if (profile.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Your profile is suspended. Reason: ${profile.suspendedReason || "Contact admin"}`,
      });
    }

    // Can't go available if currently handling a request
    if (profile.currentRequestId && !profile.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You cannot go available while handling an active request",
      });
    }

    profile.isAvailable = !profile.isAvailable;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `You are now ${profile.isAvailable ? "available" : "unavailable"} for requests`,
      isAvailable: profile.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/stats
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getVolunteerStats = async (req, res, next) => {
  try {
    const profile = await Volunteer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    const stats = {
      reputationScore: profile.reputationScore,
      averageRating: profile.averageRating,
      totalRatings: profile.totalRatings,
      totalAssigned: profile.totalAssigned,
      totalAccepted: profile.totalAccepted,
      totalCompleted: profile.totalCompleted,
      totalCancelled: profile.totalCancelled,
      totalNoResponse: profile.totalNoResponse,
      acceptanceRate: profile.acceptanceRate,
      completionRate: profile.completionRate,
      cancellationRate: profile.cancellationRate,
      isApproved: profile.isApproved,
      isAvailable: profile.isAvailable,
      isSuspended: profile.isSuspended,
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/ratings
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyRatings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const profile = await Volunteer.findOne({ user: req.user.id })
      .select("ratings averageRating totalRatings")
      .populate("ratings.givenBy", "name profilePicture")
      .populate("ratings.requestId", "title emergencyType");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    // Sort ratings newest first, then paginate
    const sortedRatings = profile.ratings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      averageRating: profile.averageRating,
      totalRatings: profile.totalRatings,
      ratings: sortedRatings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(profile.totalRatings / limit),
        totalRatings: profile.totalRatings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/history
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getVolunteerHistory = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter — import HelpRequest here to avoid circular deps
    const { default: HelpRequest } = await import("../models/HelpRequest.model.js");

    const filter = { assignedVolunteer: req.user.id };
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      HelpRequest.find(filter)
        .populate("user", "name phone location")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      HelpRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRequests: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/active-request
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveRequest = async (req, res, next) => {
  try {
    const profile = await Volunteer.findOne({ user: req.user.id })
      .select("currentRequestId isAvailable")
      .populate({
        path: "currentRequestId",
        populate: {
          path: "user",
          select: "name phone location bloodGroup",
        },
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    if (!profile.currentRequestId) {
      return res.status(200).json({
        success: true,
        activeRequest: null,
        message: "No active request at the moment",
      });
    }

    res.status(200).json({
      success: true,
      activeRequest: profile.currentRequestId,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/request/:requestId/accept
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { default: HelpRequest } = await import("../models/HelpRequest.model.js");

    const [profile, request] = await Promise.all([
      Volunteer.findOne({ user: req.user.id }),
      HelpRequest.findById(requestId),
    ]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!profile.isApproved || profile.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your volunteer account is not eligible to accept requests",
      });
    }

    if (!profile.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are currently unavailable or handling another request",
      });
    }

    if (request.status !== "posted") {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}`,
      });
    }

    // Assign the volunteer to the request
    request.assignedVolunteer = req.user.id;
    request.status = "accepted";
    request.acceptedAt = new Date();
    await request.save();

    // Update volunteer profile
    profile.assignRequest(requestId);
    profile.totalAccepted += 1;
    await profile.save();

    // Recalculate reputation score
    await ScoringService.recalculate(profile._id);

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/request/:requestId/complete
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const completeRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { default: HelpRequest } = await import("../models/HelpRequest.model.js");

    const [profile, request] = await Promise.all([
      Volunteer.findOne({ user: req.user.id }),
      HelpRequest.findById(requestId),
    ]);

    if (!profile || !request) {
      return res.status(404).json({ success: false, message: "Profile or request not found" });
    }

    if (request.assignedVolunteer?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this request",
      });
    }

    if (!["accepted", "in_progress"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Request cannot be marked complete in its current status",
      });
    }

    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    // Free up volunteer
    profile.freeUp();
    profile.totalCompleted += 1;
    await profile.save();

    // Recalculate score
    await ScoringService.recalculate(profile._id);

    res.status(200).json({
      success: true,
      message: "Request marked as completed",
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/request/:requestId/cancel
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const { default: HelpRequest } = await import("../models/HelpRequest.model.js");

    const [profile, request] = await Promise.all([
      Volunteer.findOne({ user: req.user.id }),
      HelpRequest.findById(requestId),
    ]);

    if (!profile || !request) {
      return res.status(404).json({ success: false, message: "Profile or request not found" });
    }

    if (request.assignedVolunteer?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this request",
      });
    }

    if (!["accepted", "in_progress"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a request in its current status",
      });
    }

    // Reset request back to posted so it can be reassigned
    request.status = "posted";
    request.assignedVolunteer = null;
    request.acceptedAt = null;
    request.cancellationHistory = request.cancellationHistory || [];
    request.cancellationHistory.push({
      cancelledBy: req.user.id,
      role: "volunteer",
      reason: reason || "No reason provided",
      cancelledAt: new Date(),
    });
    await request.save();

    // Update volunteer metrics
    profile.freeUp();
    profile.totalCancelled += 1;
    await profile.save();

    // Recalculate score — cancellation hurts reputation
    await ScoringService.recalculate(profile._id);

    res.status(200).json({
      success: true,
      message: "Request cancelled. It has been re-posted for other volunteers.",
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/request/:requestId/in-progress
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const markInProgress = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { default: HelpRequest } = await import("../models/HelpRequest.model.js");

    const request = await HelpRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.assignedVolunteer?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this request",
      });
    }

    if (request.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Request must be in accepted status to mark as in progress",
      });
    }

    request.status = "in_progress";
    request.inProgressAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: "Request marked as in progress",
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/available  (Admin / Matching Engine use)
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableVolunteers = async (req, res, next) => {
  try {
    const { city, emergencyType, bloodGroup, minScore = 0 } = req.query;

    const filter = {
      isAvailable: true,
      isApproved: true,
      isSuspended: false,
      reputationScore: { $gte: parseInt(minScore) },
    };

    if (city) filter["serviceArea.city"] = new RegExp(city, "i");
    if (emergencyType) filter.emergencyTypes = emergencyType;

    let volunteers = await Volunteer.find(filter)
      .populate("user", "name email phone bloodGroup location")
      .sort({ reputationScore: -1 });

    // Filter by blood group if needed (stored on User, not Volunteer)
    if (bloodGroup) {
      volunteers = volunteers.filter(
        (v) => v.user?.bloodGroup === bloodGroup
      );
    }

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/:id  (Public profile view)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getVolunteerById = async (req, res, next) => {
  try {
    const profile = await Volunteer.findById(req.params.id)
      .populate("user", "name profilePicture location bloodGroup")
      .select("-cnic -ratings -refreshToken");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};