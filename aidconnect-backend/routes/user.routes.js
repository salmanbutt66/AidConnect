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
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.patch("/profile/picture", updateProfilePicture);
router.patch("/change-password", changePassword);
router.get("/my-requests", getMyRequests);
router.get("/my-requests/:id", getMyRequestById);
router.post("/rate", rateVolunteer);
router.get("/volunteer/:id/ratings", getVolunteerRatings);
router.patch("/notification-preferences", updateNotificationPreferences);

export default router;