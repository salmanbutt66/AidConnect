
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
export const protect = async (req, res, next) => {
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
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
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
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${
          user.bannedReason || "Violation of terms"
        }`,
        code: "ACCOUNT_BANNED",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }
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
    req.resource = resource;
    next();
  } catch (error) {
    next(error);
  }
};
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