// middleware/role.middleware.js

import Volunteer from "../models/Volunteer.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// restrictTo — role-based access control gate
// Usage: router.get("/admin-only", protect, restrictTo("admin"), handler)
//        router.get("/multi",      protect, restrictTo("admin", "volunteer"), handler)
// ─────────────────────────────────────────────────────────────────────────────
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to: ${allowedRoles.join(", ")}`,
        code: "INSUFFICIENT_ROLE",
      });
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// restrictToSelf — user can only access their own resource
// Admin can access any resource
// Usage: router.get("/:userId/data", protect, restrictToSelf, handler)
// Expects the route param to be :userId
// ─────────────────────────────────────────────────────────────────────────────
export const restrictToSelf = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const isAdmin = req.user.role === "admin";
  const isSelf  = req.params.userId === req.user.id;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own resources",
      code: "NOT_OWN_RESOURCE",
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// requireApprovedVolunteer — volunteer must be approved + not suspended
// Lighter version of checkVolunteerApproval from auth.middleware
// Use when you only need the approval check without re-fetching profile
// ─────────────────────────────────────────────────────────────────────────────
export const requireApprovedVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== "volunteer") {
      return res.status(403).json({
        success: false,
        message: "Only volunteers can access this route",
        code: "NOT_VOLUNTEER",
      });
    }

    const profile = await Volunteer.findOne({ user: req.user.id }).select(
      "isApproved isSuspended suspendedReason isAvailable"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found. Please complete your profile setup.",
        code: "VOLUNTEER_PROFILE_MISSING",
      });
    }

    if (!profile.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your volunteer profile is awaiting admin approval",
        code: "VOLUNTEER_PENDING",
      });
    }

    if (profile.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${profile.suspendedReason || "Contact admin for details"}`,
        code: "VOLUNTEER_SUSPENDED",
      });
    }

    // Attach profile snapshot to req so downstream handlers can use it
    req.volunteerProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// requireAvailableVolunteer — volunteer must be available to take new requests
// Chain after requireApprovedVolunteer
// ─────────────────────────────────────────────────────────────────────────────
export const requireAvailableVolunteer = (req, res, next) => {
  // Uses profile attached by requireApprovedVolunteer
  const profile = req.volunteerProfile;

  if (!profile) {
    return res.status(500).json({
      success: false,
      message: "Volunteer profile not loaded. Chain requireApprovedVolunteer first.",
    });
  }

  if (!profile.isAvailable) {
    return res.status(400).json({
      success: false,
      message: "You are currently unavailable. Toggle your availability to accept requests.",
      code: "VOLUNTEER_UNAVAILABLE",
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// guardAdminSelfAction — prevents admin from performing destructive
// actions on their own account (ban self, delete self, change own role)
// ─────────────────────────────────────────────────────────────────────────────
export const guardAdminSelfAction = (req, res, next) => {
  if (req.user.role !== "admin") return next();

  const targetId = req.params.id || req.params.userId;

  if (targetId && targetId === req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Admins cannot perform this action on their own account",
      code: "ADMIN_SELF_ACTION",
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// logRoleAccess — dev/debug middleware to log role-based access attempts
// Only active when NODE_ENV is development
// Place after protect, before restrictTo for visibility
// ─────────────────────────────────────────────────────────────────────────────
export const logRoleAccess = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[ROLE ACCESS] ${new Date().toISOString()} | ` +
      `User: ${req.user?.id || "guest"} | ` +
      `Role: ${req.user?.role || "none"} | ` +
      `${req.method} ${req.originalUrl}`
    );
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// requireAnyOf — allows access if user has ANY of the given roles
// Alias of restrictTo but reads more clearly in complex route chains
// Usage: requireAnyOf("admin", "volunteer")
// ─────────────────────────────────────────────────────────────────────────────
export const requireAnyOf = (...roles) => restrictTo(...roles);

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONSTANTS — use these instead of hardcoding strings in routes
// Import in route files: import { ROLES } from "../middleware/role.middleware.js"
// ─────────────────────────────────────────────────────────────────────────────
export const ROLES = {
  USER:      "user",
  VOLUNTEER: "volunteer",
  PROVIDER:  "provider",
  ADMIN:     "admin",
};