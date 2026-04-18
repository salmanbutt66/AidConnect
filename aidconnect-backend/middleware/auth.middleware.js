// middleware/auth.middleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// protect — verifies JWT and attaches user to req.user
// Used on every private route
// ─────────────────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try Authorization header first (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Fall back to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // 3. No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }

    // 4. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Distinguish between expired and invalid
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
        code: "TOKEN_INVALID",
      });
    }

    // 5. Find user from decoded token
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // 6. Check if account is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${
          user.bannedReason || "Violation of terms"
        }`,
        code: "ACCOUNT_BANNED",
      });
    }

    // 7. Check if account is still active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // 8. Attach user + decoded role to request object
    req.user = {
      id:    user._id.toString(),
      role:  decoded.role,
      email: user.email,
      name:  user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// optionalAuth — attaches user if token present but doesn't block if missing
// Used on public routes that behave differently for logged-in users
// e.g. Landing page showing personalized content if logged in
// ─────────────────────────────────────────────────────────────────────────────
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next(); // no token = just continue as guest
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select(
        "-password -refreshToken"
      );

      if (user && user.isActive && !user.isBanned) {
        req.user = {
          id:   user._id.toString(),
          role: decoded.role,
          email: user.email,
          name:  user.name,
        };
      } else {
        req.user = null;
      }
    } catch {
      req.user = null; // expired/invalid token — treat as guest
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyOwnership — checks that the requesting user owns the resource
// Usage: router.put("/:id", protect, verifyOwnership(Model), handler)
// The model must have a `user` field referencing User._id
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOwnership = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const ownerId =
      resource.user?.toString() ||
      resource._id?.toString();

    const isOwner = ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    // Attach the resource to req so the next handler doesn't refetch
    req.resource = resource;
    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkVolunteerApproval — blocks unapproved/suspended volunteers from acting
// Use on volunteer action routes (accept, complete, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const checkVolunteerApproval = async (req, res, next) => {
  try {
    if (req.user.role !== "volunteer") return next();

    const Volunteer = (await import("../models/Volunteer.model.js")).default;
    const profile   = await Volunteer.findOne({ user: req.user.id }).select(
      "isApproved isSuspended suspendedReason"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    if (!profile.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your volunteer profile is pending admin approval",
        code: "VOLUNTEER_PENDING",
      });
    }

    if (profile.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Your volunteer account is suspended. Reason: ${
          profile.suspendedReason || "Contact admin"
        }`,
        code: "VOLUNTEER_SUSPENDED",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// rateLimiter — simple in-memory rate limiter per IP
// Prevents brute force on login/register without needing extra packages
// For production use express-rate-limit instead
// ─────────────────────────────────────────────────────────────────────────────
const requestCounts = new Map();

export const rateLimiter = (maxRequests = 10, windowMs = 60 * 1000) => {
  return (req, res, next) => {
    const ip  = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = requestCounts.get(ip);

    // Reset window if expired
    if (now - record.startTime > windowMs) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please try again after ${Math.ceil(
          (windowMs - (now - record.startTime)) / 1000
        )} seconds.`,
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    next();
  };
};