import express from "express";
import {
  registerProvider,
  getProviderProfile,
  updateProviderProfile,
  toggleAvailability,
  getRelevantRequests,
  acceptRequest,
  getAllProviders,
  verifyProvider,
  suspendProvider,
} from "../controllers/provider.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
const router = express.Router();
//  Public → None (all provider routes are protected)
// Provider only 
router.post("/register", protect, registerProvider);
router.get("/profile", protect, restrictTo("provider"), getProviderProfile);
router.put("/profile", protect, restrictTo("provider"), updateProviderProfile);
router.put("/availability", protect, restrictTo("provider"), toggleAvailability);
router.get("/requests", protect, restrictTo("provider"), getRelevantRequests);
router.put("/requests/:id/accept", protect, restrictTo("provider"), acceptRequest);
// Admin only 
router.get("/", protect, restrictTo("admin"), getAllProviders);
router.put("/:id/verify", protect, restrictTo("admin"), verifyProvider);
router.put("/:id/suspend", protect, restrictTo("admin"), suspendProvider);
export default router;