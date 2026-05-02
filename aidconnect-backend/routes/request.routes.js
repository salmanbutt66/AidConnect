// routes/request.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import {
  createRequest,
  getMyRequests,
  getNearbyRequests,
  getRequestById,
  cancelRequest,
  acceptRequest,
  updateRequestStatus,
  rateRequest,
  getAllRequests,
  deleteRequest,
} from "../controllers/request.controller.js";

const router = express.Router();

// ─────────────────────────────────────────
// STATIC ROUTES FIRST — must come before /:id
// Express matches top-to-bottom. Any static segment (/my, /nearby, /)
// that is registered after /:id would be swallowed by the dynamic route.
// ─────────────────────────────────────────

// ADMIN — GET /api/requests  (no path segment — register before /:id)
router.get("/",            protect, restrictTo("admin"),               getAllRequests);

// USER
router.post("/",           protect, restrictTo("user"),                createRequest);
router.get("/my",          protect, restrictTo("user"),                getMyRequests);

// VOLUNTEER
router.get("/nearby",      protect, restrictTo("volunteer"),           getNearbyRequests);

// ─────────────────────────────────────────
// DYNAMIC ROUTES — after all static routes
// ─────────────────────────────────────────

// Shared — any authenticated user can fetch a single request by ID
router.get("/:id",         protect,                                    getRequestById);

// USER actions on a specific request
router.put("/:id/cancel",  protect, restrictTo("user"),                cancelRequest);
router.post("/:id/rate",   protect, restrictTo("user"),                rateRequest);

// VOLUNTEER actions on a specific request
// NOTE: this endpoint requires { matchId } in the body — it is used by the
// Matches flow only. For direct accepts from the dashboard or ActiveRequest
// page use PUT /api/volunteers/request/:requestId/accept instead, which does
// NOT require a matchId.
router.put("/:id/accept",  protect, restrictTo("volunteer"),           acceptRequest);

// VOLUNTEER + PROVIDER — status transitions (in_progress → completed)
router.put("/:id/status",  protect, restrictTo("volunteer", "provider"), updateRequestStatus);

// ADMIN
router.delete("/:id",      protect, restrictTo("admin"),               deleteRequest);

export default router;