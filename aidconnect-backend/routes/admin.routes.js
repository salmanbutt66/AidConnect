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

// GET    /api/admin/users              → get all users (filters + pagination)
// GET    /api/admin/users/:id          → get single user
// PATCH  /api/admin/users/:id/ban      → ban a user
// PATCH  /api/admin/users/:id/unban    → unban a user
// PATCH  /api/admin/users/:id/verify   → verify a user
// DELETE /api/admin/users/:id          → delete a user

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.patch("/users/:id/verify", verifyUser);
router.delete("/users/:id", deleteUser);

// ─────────────────────────────────────────────
// 📋 REQUEST MANAGEMENT ROUTES
// ─────────────────────────────────────────────

// GET   /api/admin/requests            → get all requests (filters + pagination)
// PATCH /api/admin/requests/:id/cancel → force cancel a request

router.get("/requests", getAllRequests);
router.patch("/requests/:id/cancel", cancelRequest);

// ─────────────────────────────────────────────
// 📊 ANALYTICS ROUTES
// ─────────────────────────────────────────────

// GET /api/admin/analytics/overview         → system wide counts
// GET /api/admin/analytics/emergency-types  → most common emergencies
// GET /api/admin/analytics/monthly-trends   → requests per month
// GET /api/admin/analytics/top-volunteers   → highest rated volunteers
// GET /api/admin/analytics/high-risk-areas  → cities with most requests

router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/emergency-types", getEmergencyTypeStats);
router.get("/analytics/monthly-trends", getMonthlyTrends);
router.get("/analytics/top-volunteers", getTopVolunteers);
router.get("/analytics/high-risk-areas", getHighRiskAreas);

export default router;