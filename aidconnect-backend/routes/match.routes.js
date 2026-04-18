// routes/match.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import {
  getRequestMatches,
  declineMatch,
  getMyMatches,
} from "../controllers/match.controller.js";

const router = express.Router();

// ─────────────────────────────────────────
// VOLUNTEER ROUTES
// ─────────────────────────────────────────
router.get("/my",          protect, restrictTo("volunteer"),           getMyMatches);
router.put("/:id/decline", protect, restrictTo("volunteer"),           declineMatch);

// ─────────────────────────────────────────
// ADMIN + VOLUNTEER ROUTES
// ─────────────────────────────────────────
router.get("/request/:id", protect, restrictTo("admin", "volunteer"),  getRequestMatches);

export default router;