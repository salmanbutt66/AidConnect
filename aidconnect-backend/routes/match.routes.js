// routes/match.routes.js
// Defines all match API endpoints for AidConnect
//
// ALL ROUTES:
//   GET /api/matches/my           → getMyMatches      (volunteer)
//   GET /api/matches/request/:id  → getRequestMatches (admin/volunteer)
//   PUT /api/matches/:id/decline  → declineMatch      (volunteer)

const express = require("express");
const router = express.Router();

// ── IMPORT MIDDLEWARE ──────────────────────
// Salman's middleware — use but never edit
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// ── IMPORT CONTROLLER FUNCTIONS ────────────
const {
  getRequestMatches,
  declineMatch,
  getMyMatches,
} = require("../controllers/match.controller");

// ─────────────────────────────────────────
// VOLUNTEER ROUTES
// ─────────────────────────────────────────

// Get all match notifications for logged in volunteer
// This is what populates volunteer dashboard
router.get(
  "/my",
  protect,
  authorize("volunteer"),
  getMyMatches
);

// Decline a match notification
router.put(
  "/:id/decline",
  protect,
  authorize("volunteer"),
  declineMatch
);

// ─────────────────────────────────────────
// ADMIN + VOLUNTEER ROUTES
// Both can see matches for a request
// Admin uses it for monitoring
// Volunteer uses it to see competition
// ─────────────────────────────────────────

// Get all matches for a specific request
router.get(
  "/request/:id",
  protect,
  authorize("admin", "volunteer"),
  getRequestMatches
);

module.exports = router;