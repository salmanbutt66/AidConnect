// routes/volunteer.routes.js
import express from "express";
import {
  getMyVolunteerProfile,
  updateVolunteerProfile,
  toggleAvailability,
  getVolunteerStats,
  getMyRatings,
  getVolunteerHistory,
  getActiveRequest,
  acceptRequest,
  completeRequest,
  cancelRequest,
  markInProgress,
  getAvailableVolunteers,
  getVolunteerById,
} from "../controllers/volunteer.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router
  .route("/profile")
  .get(restrictTo("volunteer"), getMyVolunteerProfile)
  .put(restrictTo("volunteer"), updateVolunteerProfile);

router.put("/availability",   restrictTo("volunteer"), toggleAvailability);
router.get("/stats",          restrictTo("volunteer"), getVolunteerStats);
router.get("/ratings",        restrictTo("volunteer"), getMyRatings);
router.get("/history",        restrictTo("volunteer"), getVolunteerHistory);
router.get("/active-request", restrictTo("volunteer"), getActiveRequest);

// ─── Request Lifecycle ────────────────────────────────────────────────────────

router.put("/request/:requestId/accept",      restrictTo("volunteer"), acceptRequest);
router.put("/request/:requestId/in-progress", restrictTo("volunteer"), markInProgress);
router.put("/request/:requestId/complete",    restrictTo("volunteer"), completeRequest);
router.put("/request/:requestId/cancel",      restrictTo("volunteer"), cancelRequest);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.get("/available", restrictTo("admin"), getAvailableVolunteers);

router.get(
  "/all",
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const Volunteer = (await import("../models/Volunteer.model.js")).default;

      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip  = (page - 1) * limit;

      const {
        isApproved, isAvailable, isSuspended,
        city, emergencyType, minScore, search,
      } = req.query;

      const filter = {};
      if (isApproved  !== undefined) filter.isApproved  = isApproved  === "true";
      if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
      if (isSuspended !== undefined) filter.isSuspended = isSuspended === "true";
      if (city)          filter["serviceArea.city"] = new RegExp(city, "i");
      if (emergencyType) filter.emergencyTypes      = emergencyType;
      if (minScore)      filter.reputationScore     = { $gte: parseInt(minScore) };

      if (search) {
        const User = (await import("../models/User.model.js")).default;
        const matchingUsers = await User.find({
          $or: [
            { name:  new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
          ],
        }).select("_id");

        filter.user = { $in: matchingUsers.map((u) => u._id) };
      }

      const [volunteers, total] = await Promise.all([
        Volunteer.find(filter)
          .populate("user", "name email phone bloodGroup location profilePicture")
          .sort({ reputationScore: -1 })
          .skip(skip)
          .limit(limit),
        Volunteer.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        volunteers,
        pagination: {
          currentPage:     page,
          totalPages:      Math.ceil(total / limit),
          totalVolunteers: total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/approve",
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const Volunteer = (await import("../models/Volunteer.model.js")).default;

      const profile = await Volunteer.findById(req.params.id).populate("user", "name email");
      if (!profile) {
        return res.status(404).json({ success: false, message: "Volunteer not found" });
      }

      if (profile.isApproved) {
        return res.status(400).json({ success: false, message: "Volunteer is already approved" });
      }

      profile.isApproved      = true;
      profile.approvedAt      = new Date();
      profile.approvedBy      = req.user.id;
      profile.isSuspended     = false;
      profile.suspendedReason = null;
      profile.isAvailable     = true;
      await profile.save();

      res.status(200).json({
        success: true,
        message: `Volunteer ${profile.user.name} approved successfully`,
        profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/suspend",
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const Volunteer  = (await import("../models/Volunteer.model.js")).default;
      const { reason } = req.body;

      const profile = await Volunteer.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: "Volunteer not found" });
      }

      profile.isSuspended     = true;
      profile.suspendedReason = reason || "Suspended by admin";
      profile.isAvailable     = false;
      await profile.save();

      res.status(200).json({ success: true, message: "Volunteer suspended successfully" });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/unsuspend",
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const Volunteer = (await import("../models/Volunteer.model.js")).default;

      const profile = await Volunteer.findByIdAndUpdate(
        req.params.id,
        { isSuspended: false, suspendedReason: null, isAvailable: true },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({ success: false, message: "Volunteer not found" });
      }

      res.status(200).json({ success: true, message: "Volunteer suspension lifted", profile });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/recalculate-score",
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const ScoringService = (await import("../services/scoring.service.js")).default;
      const Volunteer      = (await import("../models/Volunteer.model.js")).default;

      const profile = await Volunteer.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: "Volunteer not found" });
      }

      const newScore = await ScoringService.recalculate(profile._id);
      res.status(200).json({ success: true, message: "Reputation score recalculated", newScore });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / SHARED ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/volunteers/:id/rate — rate a volunteer after completed request
// FIX: was querying HelpRequest by { user: req.user.id } but the field
//      is requesterId, not user. Fixed to requesterId so the ownership
//      check actually works.
router.post(
  "/:id/rate",
  restrictTo("user"),
  async (req, res, next) => {
    try {
      const Volunteer                    = (await import("../models/Volunteer.model.js")).default;
      const { default: HelpRequest }     = await import("../models/HelpRequest.model.js");
      const { default: ScoringService }  = await import("../services/scoring.service.js");
      const { score, comment, requestId } = req.body;

      if (!score || score < 1 || score > 5) {
        return res.status(400).json({ success: false, message: "Score must be between 1 and 5" });
      }

      if (!requestId) {
        return res.status(400).json({ success: false, message: "requestId is required" });
      }

      // FIX: field is requesterId not user
      const request = await HelpRequest.findOne({
        _id:         requestId,
        requesterId: req.user.id,
        status:      "completed",
      });

      if (!request) {
        return res.status(403).json({
          success: false,
          message: "You can only rate volunteers for your own completed requests",
        });
      }

      const profile = await Volunteer.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: "Volunteer not found" });
      }

      const alreadyRated = profile.ratings.some(
        (r) => r.requestId?.toString() === requestId
      );

      if (alreadyRated) {
        return res.status(400).json({
          success: false,
          message: "You have already rated this volunteer for this request",
        });
      }

      profile.addRating(req.user.id, requestId, score, comment);
      await profile.save();
      await ScoringService.recalculate(profile._id);

      res.status(200).json({
        success: true,
        message: "Rating submitted successfully",
        averageRating: profile.averageRating,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/volunteers/:id — public profile (any authenticated user)
router.get("/:id", getVolunteerById);

export default router;