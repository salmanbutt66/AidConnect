// routes/admin.routes.js
import express from "express";
import {
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  verifyUser,
  deleteUser,
  getAllRequests,
  cancelRequest,
  getAnalyticsOverview,
  getEmergencyTypeStats,
  getMonthlyTrends,
  getTopVolunteers,
  getTopProviders,
  getHighRiskAreas,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin"));

// ─────────────────────────────────────────────
// 👥 USER MANAGEMENT ROUTES
// ─────────────────────────────────────────────
router.get("/users",              getAllUsers);
router.get("/users/:id",          getUserById);
router.patch("/users/:id/ban",    banUser);
router.patch("/users/:id/unban",  unbanUser);
router.patch("/users/:id/verify", verifyUser);
router.delete("/users/:id",       deleteUser);

// ─────────────────────────────────────────────
// 📋 REQUEST MANAGEMENT ROUTES
// ─────────────────────────────────────────────
router.get("/requests",                getAllRequests);
router.patch("/requests/:id/cancel",   cancelRequest);

// ─────────────────────────────────────────────
// 📊 ANALYTICS ROUTES
// ─────────────────────────────────────────────
router.get("/analytics/overview",        getAnalyticsOverview);
router.get("/analytics/emergency-types", getEmergencyTypeStats);
router.get("/analytics/monthly-trends",  getMonthlyTrends);
router.get("/analytics/top-volunteers",  getTopVolunteers);
router.get("/analytics/top-providers",   getTopProviders);
router.get("/analytics/high-risk-areas", getHighRiskAreas);

export default router;