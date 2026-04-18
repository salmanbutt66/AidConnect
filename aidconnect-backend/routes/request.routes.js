// routes/request.routes.js
// Defines all help request API endpoints for AidConnect
//
// MIDDLEWARE USED:
//   protect     → verifies JWT token (Salman's auth middleware)
//   authorize   → checks user role (Salman's role middleware)
//
// ALL ROUTES:
//   POST   /api/requests              → createRequest      (user)
//   GET    /api/requests/my           → getMyRequests      (user)
//   GET    /api/requests/nearby       → getNearbyRequests  (volunteer)
//   GET    /api/requests/:id          → getRequestById     (any logged in)
//   PUT    /api/requests/:id/cancel   → cancelRequest      (user)
//   PUT    /api/requests/:id/accept   → acceptRequest      (volunteer)
//   PUT    /api/requests/:id/status   → updateRequestStatus(volunteer/provider)
//   POST   /api/requests/:id/rate     → rateRequest        (user)
//   GET    /api/requests              → getAllRequests      (admin)
//   DELETE /api/requests/:id          → deleteRequest      (admin)

const express = require("express");
const router = express.Router();

// ── IMPORT MIDDLEWARE ──────────────────────
// These are Salman's files
// We import and USE them but never edit them
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// ── IMPORT CONTROLLER FUNCTIONS ────────────
const {
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
} = require("../controllers/request.controller");

// ─────────────────────────────────────────
// PUBLIC ROUTES
// No authentication needed
// ─────────────────────────────────────────
// None for requests — all request routes are protected

// ─────────────────────────────────────────
// USER ROUTES
// Must be logged in + role must be "user"
// ─────────────────────────────────────────

// Post a new help request
router.post(
  "/",
  protect,
  authorize("user"),
  createRequest
);

// Get own requests history
router.get(
  "/my",
  protect,
  authorize("user"),
  getMyRequests
);

// Cancel own request
router.put(
  "/:id/cancel",
  protect,
  authorize("user"),
  cancelRequest
);

// Rate a completed request
router.post(
  "/:id/rate",
  protect,
  authorize("user"),
  rateRequest
);

// ─────────────────────────────────────────
// VOLUNTEER ROUTES
// Must be logged in + role must be "volunteer"
// ─────────────────────────────────────────

// Get nearby open requests feed
router.get(
  "/nearby",
  protect,
  authorize("volunteer"),
  getNearbyRequests
);

// Accept a request via match
router.put(
  "/:id/accept",
  protect,
  authorize("volunteer"),
  acceptRequest
);

// ─────────────────────────────────────────
// VOLUNTEER + PROVIDER ROUTES
// Either volunteer or provider can update status
// ─────────────────────────────────────────

// Update request status (in_progress, completed)
router.put(
  "/:id/status",
  protect,
  authorize("volunteer", "provider"),
  updateRequestStatus
);

// ─────────────────────────────────────────
// SHARED ROUTES
// Any logged in user can access
// ─────────────────────────────────────────

// Get single request detail
router.get(
  "/:id",
  protect,
  getRequestById
);

// ─────────────────────────────────────────
// ADMIN ROUTES
// Must be logged in + role must be "admin"
// ─────────────────────────────────────────

// Get all requests with filters
router.get(
  "/",
  protect,
  authorize("admin"),
  getAllRequests
);

// Delete a request
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteRequest
);

module.exports = router;