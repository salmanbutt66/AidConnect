// routes/provider.routes.js
import express from "express";
import {
  registerProvider,
  getProviderProfile,
  updateProviderProfile,
  toggleAvailability,
  getRelevantRequests,
  getActiveRequest,
  acceptRequest,
  getAllProviders,
  verifyProvider,
  suspendProvider,
} from "../controllers/provider.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

// ─── Provider registration (any authenticated user) ──────────────────────────
router.post("/register", protect, registerProvider);

// ─── Provider profile & settings ─────────────────────────────────────────────
router.get ("/profile",      protect, restrictTo("provider"), getProviderProfile);
router.put ("/profile",      protect, restrictTo("provider"), updateProviderProfile);
router.put ("/availability", protect, restrictTo("provider"), toggleAvailability);

// ─── Request routes — STATIC paths MUST come before dynamic /:id paths ───────
// FIX: /requests/active was previously defined after /requests/:id/accept.
// Even though they differ by HTTP method (GET vs PUT), keeping static
// segments before parameterised ones is the correct Express convention
// and prevents any future ambiguity if methods are ever adjusted.
router.get("/requests",        protect, restrictTo("provider"), getRelevantRequests);
router.get("/requests/active", protect, restrictTo("provider"), getActiveRequest);    // ← BEFORE /:id
router.put("/requests/:id/accept", protect, restrictTo("provider"), acceptRequest);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get("/"         , protect, restrictTo("admin"), getAllProviders);
router.put("/:id/verify",  protect, restrictTo("admin"), verifyProvider);
router.put("/:id/suspend", protect, restrictTo("admin"), suspendProvider);

export default router;