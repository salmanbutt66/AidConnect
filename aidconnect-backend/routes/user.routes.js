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
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.patch("/profile/picture", updateProfilePicture);
router.patch("/change-password", changePassword);

// ─────────────────────────────────────────────
// 📋 MY REQUESTS ROUTES
// ─────────────────────────────────────────────
router.get("/my-requests", getMyRequests);
router.get("/my-requests/:id", getMyRequestById);

// ─────────────────────────────────────────────
// ⭐ RATING ROUTES
// ─────────────────────────────────────────────
router.post("/rate", rateVolunteer);
router.get("/volunteer/:id/ratings", getVolunteerRatings);

// ─────────────────────────────────────────────
// 🔔 NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────
router.patch("/notification-preferences", updateNotificationPreferences);

export default router;