// routes/user.routes.js
import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  updateProfilePicture,
  changePassword,
  getMyRequests,
  getMyRequestById,
  rateVolunteer,
  getVolunteerRatings,
  updateNotificationPreferences,
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();
router.use(protect);

// ─────────────────────────────────────────────
// 👤 PROFILE ROUTES
// ─────────────────────────────────────────────

// GET   /api/users/profile          → get my profile
// PATCH /api/users/profile          → update my profile
// PATCH /api/users/profile/picture  → update profile picture
// PATCH /api/users/change-password  → change password

router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.patch("/profile/picture", updateProfilePicture);
router.patch("/change-password", changePassword);

// ─────────────────────────────────────────────
// 📋 MY REQUESTS ROUTES
// ─────────────────────────────────────────────

// GET /api/users/my-requests      → all my requests (filter + pagination)
// GET /api/users/my-requests/:id  → single request detail

router.get("/my-requests", getMyRequests);
router.get("/my-requests/:id", getMyRequestById);

// ─────────────────────────────────────────────
// ⭐ RATING ROUTES
// ─────────────────────────────────────────────

// POST /api/users/rate                      → rate a volunteer
// GET  /api/users/volunteer/:id/ratings     → get volunteer's ratings

router.post("/rate", rateVolunteer);
router.get("/volunteer/:id/ratings", getVolunteerRatings);

// ─────────────────────────────────────────────
// 🔔 NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────

// PATCH /api/users/notification-preferences → toggle email/inApp

router.patch("/notification-preferences", updateNotificationPreferences);

export default router;