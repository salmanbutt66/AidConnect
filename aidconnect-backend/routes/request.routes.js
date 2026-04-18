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
// USER ROUTES
// ─────────────────────────────────────────
router.post("/",           protect, restrictTo("user"),      createRequest);
router.get("/my",          protect, restrictTo("user"),      getMyRequests);
router.put("/:id/cancel",  protect, restrictTo("user"),      cancelRequest);
router.post("/:id/rate",   protect, restrictTo("user"),      rateRequest);

// ─────────────────────────────────────────
// VOLUNTEER ROUTES
// ─────────────────────────────────────────
router.get("/nearby",      protect, restrictTo("volunteer"), getNearbyRequests);
router.put("/:id/accept",  protect, restrictTo("volunteer"), acceptRequest);

// ─────────────────────────────────────────
// VOLUNTEER + PROVIDER ROUTES
// ─────────────────────────────────────────
router.put("/:id/status",  protect, restrictTo("volunteer", "provider"), updateRequestStatus);

// ─────────────────────────────────────────
// SHARED ROUTES
// ─────────────────────────────────────────
router.get("/:id",         protect, getRequestById);

// ─────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────
router.get("/",            protect, restrictTo("admin"),     getAllRequests);
router.delete("/:id",      protect, restrictTo("admin"),     deleteRequest);

export default router;