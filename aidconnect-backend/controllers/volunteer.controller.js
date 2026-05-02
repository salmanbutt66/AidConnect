// controllers/volunteer.controller.js
import Volunteer from "../models/Volunteer.model.js";
import User from "../models/User.model.js";
import HelpRequest from "../models/HelpRequest.model.js";
import Match from "../models/Match.model.js";
import ScoringService from "../services/scoring.service.js";
import { sendPaginated, sendError, sendSuccess } from "../utils/apiResponse.js";
import {
  notifyRequestAccepted,
  notifyRequestCompleted,
} from "../services/notification.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/volunteers/profile
// @access  Private (volunteer only)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyVolunteerProfile = async (req, res, next) => {
  try {
    const profile = await Volunteer.findOne({ user: req.user.id })
      .populate("user", "name email phone bloodGroup location profilePicture")
      .populate("currentRequestId", "emergencyType status urgencyLevel");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    res.status(200).json({ success: true, profile });
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
      bio, skills, emergencyTypes, serviceArea,
      availabilitySchedule, canDonatBlood,
      lastDonationDate, cnic, radiusKm,
    } = req.body;

    const profile = await Volunteer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    if (bio !== undefined)            profile.bio            = bio;
    if (skills !== undefined)         profile.skills         = skills;
    if (emergencyTypes !== undefined) profile.emergencyTypes = emergencyTypes;
    if (availabilitySchedule !== undefined) {
      profile.availabilitySchedule = availabilitySchedule;
    }
    if (canDonatBlood !== undefined)  profile.canDonatBlood  = canDonatBlood;
    if (lastDonationDate)             profile.lastDonationDate = lastDonationDate;
    if (cnic)                         profile.cnic           = cnic;

    if (serviceArea !== undefined) {
      if (serviceArea.city !== undefined) {
        profile.serviceArea.city = serviceArea.city || null;
      }
      if (serviceArea.area !== undefined) {
        profile.serviceArea.area = serviceArea.area || null;
      }
    }
    if (radiusKm !== undefined) {
      profile.serviceArea.radiusKm = Number(radiusKm);
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
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
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
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    const stats = {
      reputationScore:  profile.reputationScore,
      averageRating:    profile.averageRating,
      totalRatings:     profile.totalRatings,
      totalAssigned:    profile.totalAssigned,
      totalAccepted:    profile.totalAccepted,
      totalCompleted:   profile.totalCompleted,
      totalCancelled:   profile.totalCancelled,
      totalNoResponse:  profile.totalNoResponse,
      acceptanceRate:   profile.acceptanceRate,
      completionRate:   profile.completionRate,
      cancellationRate: profile.cancellationRate,
      isApproved:       profile.isApproved,
      isAvailable:      profile.isAvailable,
      isSuspended:      profile.isSuspended,
    };

    res.status(200).json({ success: true, stats });
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
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const profile = await Volunteer.findOne({ user: req.user.id })
      .select("ratings averageRating totalRatings")
      .populate("ratings.givenBy",   "name profilePicture")
      .populate("ratings.requestId", "emergencyType");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    const sortedRatings = profile.ratings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    return sendPaginated(res, "Volunteer ratings fetched successfully", sortedRatings, {
      total: profile.totalRatings,
      page,
      limit,
      pages: Math.ceil(profile.totalRatings / limit),
      averageRating: profile.averageRating,
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
    const skip     = (parseInt(page)  - 1) * parseInt(limit);
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);

    const profile = await Volunteer.findOne({ user: req.user.id }).select("_id");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    const filter = { assignedTo: profile._id };
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      HelpRequest.find(filter)
        .populate("requesterId", "name phone location")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      HelpRequest.countDocuments(filter),
    ]);

    return sendPaginated(res, "Request history fetched successfully", requests, {
      total,
      page:  pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
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
          path: "requesterId",
          select: "name phone location bloodGroup",
        },
      });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    if (!profile.currentRequestId) {
      return res.status(200).json({
        success:       true,
        activeRequest: null,
        message:       "No active request at the moment",
      });
    }

    // FIX: if the stored request is completed or cancelled, clear the stale
    // currentRequestId so the volunteer isn't permanently stuck. This covers
    // edge cases where freeUp() wasn't called (e.g. admin force-cancel).
    const req_ = profile.currentRequestId;
    if (req_ && ["completed", "cancelled"].includes(req_.status)) {
      await Volunteer.findOneAndUpdate(
        { user: req.user.id },
        { currentRequestId: null, isAvailable: true }
      );
      return res.status(200).json({
        success:       true,
        activeRequest: null,
        message:       "No active request at the moment",
      });
    }

    res.status(200).json({ success: true, activeRequest: profile.currentRequestId });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteers/request/:requestId/accept
// @access  Private (volunteer only)
//
// FIX: Changed the availability guard from `!profile.isAvailable` to
// `profile.currentRequestId`. The isAvailable toggle is a preference flag
// for the matching engine — it tells the system who to notify about new
// requests. It must NOT block a volunteer from manually accepting a request
// they can see in their dashboard.
//
// The real "are you busy?" check is currentRequestId. A volunteer who just
// got approved has isAvailable:false by default and would hit a 400 on every
// accept attempt under the old logic, with no obvious reason why.
// ─────────────────────────────────────────────────────────────────────────────
export const acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

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

    // Must be approved and not suspended
    if (!profile.isApproved || profile.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your volunteer account is not eligible to accept requests",
      });
    }

    // FIX: check for an existing active assignment, not the availability toggle
    if (profile.currentRequestId) {
      return res.status(400).json({
        success: false,
        message: "You are already handling an active request. Complete or cancel it first.",
      });
    }

    if (request.status !== "posted") {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}`,
      });
    }

    // ── Update the request ────────────────────────────────────────────────
    request.assignedTo   = profile._id;
    request.assignedType = "Volunteer";
    request.status       = "accepted";
    request.acceptedAt   = new Date();
    request.responseTime = Math.round((request.acceptedAt - request.postedAt) / 1000 / 60);
    await request.save();

    // ── Update volunteer profile ──────────────────────────────────────────
    profile.currentRequestId = request._id;
    profile.isAvailable      = false;
    profile.totalAssigned   += 1;
    profile.totalAccepted   += 1;
    await profile.save();

    // ── Update Match documents ────────────────────────────────────────────
    await Match.findOneAndUpdate(
      { requestId: request._id, matchedTo: profile._id, status: "notified" },
      { status: "accepted", respondedAt: new Date() }
    );
    await Match.updateMany(
      { requestId: request._id, matchedTo: { $ne: profile._id }, status: "notified" },
      { status: "expired" }
    );

    await notifyRequestAccepted(request.requesterId, request);
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

    const [profile, request] = await Promise.all([
      Volunteer.findOne({ user: req.user.id }),
      HelpRequest.findById(requestId),
    ]);

    if (!profile || !request) {
      return res.status(404).json({ success: false, message: "Profile or request not found" });
    }

    if (request.assignedTo?.toString() !== profile._id.toString()) {
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

    request.status         = "completed";
    request.completedAt    = new Date();
    request.resolutionTime = Math.round((request.completedAt - request.postedAt) / 1000 / 60);
    await request.save();

    profile.freeUp();
    profile.totalCompleted += 1;
    await profile.save();

    await notifyRequestCompleted(request.requesterId, request);
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

    const [profile, request] = await Promise.all([
      Volunteer.findOne({ user: req.user.id }),
      HelpRequest.findById(requestId),
    ]);

    if (!profile || !request) {
      return res.status(404).json({ success: false, message: "Profile or request not found" });
    }

    if (request.assignedTo?.toString() !== profile._id.toString()) {
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

    // Reset request back to posted so other volunteers can pick it up
    request.status       = "posted";
    request.assignedTo   = null;
    request.assignedType = null;
    request.acceptedAt   = null;
    await request.save();

    // Re-open any expired matches so other volunteers can still respond
    await Match.updateMany(
      { requestId: request._id, status: "expired" },
      { status: "notified" }
    );

    profile.freeUp();
    profile.totalCancelled += 1;
    await profile.save();

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

    const request = await HelpRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const profile = await Volunteer.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer profile not found" });
    }

    if (request.assignedTo?.toString() !== profile._id.toString()) {
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
// @route   GET /api/volunteers/available
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableVolunteers = async (req, res, next) => {
  try {
    const { city, emergencyType, bloodGroup, minScore = 0 } = req.query;

    const filter = {
      isAvailable:     true,
      isApproved:      true,
      isSuspended:     false,
      reputationScore: { $gte: parseInt(minScore) },
    };

    if (city)          filter["serviceArea.city"] = new RegExp(city, "i");
    if (emergencyType) filter.emergencyTypes       = emergencyType;

    let volunteers = await Volunteer.find(filter)
      .populate("user", "name email phone bloodGroup location")
      .sort({ reputationScore: -1 });

    if (bloodGroup) {
      volunteers = volunteers.filter((v) => v.user?.bloodGroup === bloodGroup);
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
// @route   GET /api/volunteers/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getVolunteerById = async (req, res, next) => {
  try {
    const profile = await Volunteer.findById(req.params.id)
      .populate("user", "name profilePicture location bloodGroup")
      .select("-cnic -ratings");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};