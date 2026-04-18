// routes/auth.routes.js

import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} from "../utils/validators.js";

const router = express.Router();

// ─── Public Routes (no auth required) ────────────────────────────────────────

// POST /api/auth/register
router.post("/register", validateRegister, register);

// POST /api/auth/login
router.post("/login", validateLogin, login);

// POST /api/auth/refresh-token
router.post("/refresh-token", refreshToken);

// ─── Private Routes (must be logged in) ──────────────────────────────────────

// POST /api/auth/logout
router.post("/logout", protect, logout);

// GET /api/auth/me
router.get("/me", protect, getMe);

// PUT /api/auth/update-profile
router.put("/update-profile", protect, validateUpdateProfile, updateProfile);

// PUT /api/auth/change-password
router.put("/change-password", protect, validateChangePassword, changePassword);

// DELETE /api/auth/delete-account
router.delete("/delete-account", protect, deleteAccount);

// ─── Admin Only Routes ────────────────────────────────────────────────────────

// GET /api/auth/users — get all users (admin panel)
router.get(
  "/users",
  protect,
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const User = (await import("../models/User.model.js")).default;

      const page     = parseInt(req.query.page)  || 1;
      const limit    = parseInt(req.query.limit) || 10;
      const skip     = (page - 1) * limit;
      const { role, isBanned, isActive, search } = req.query;

      const filter = {};
      if (role)                        filter.role     = role;
      if (isBanned !== undefined)      filter.isBanned = isBanned === "true";
      if (isActive !== undefined)      filter.isActive = isActive === "true";
      if (search) {
        filter.$or = [
          { name:  new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password -refreshToken")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/users/:id/ban — ban a user
router.put(
  "/users/:id/ban",
  protect,
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const User = (await import("../models/User.model.js")).default;
      const { reason } = req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot ban another admin",
        });
      }

      user.isBanned     = true;
      user.bannedReason = reason || "Violation of terms of service";
      user.refreshToken = null; // force logout
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        message: `User ${user.name} has been banned`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/users/:id/unban — unban a user
router.put(
  "/users/:id/unban",
  protect,
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const User = (await import("../models/User.model.js")).default;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false, bannedReason: null },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: `User ${user.name} has been unbanned`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/users/:id/role — change a user's role
router.put(
  "/users/:id/role",
  protect,
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const User      = (await import("../models/User.model.js")).default;
      const Volunteer = (await import("../models/Volunteer.model.js")).default;
      const { role }  = req.body;

      const allowedRoles = ["user", "volunteer", "provider"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Allowed: user, volunteer, provider",
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const oldRole = user.role;
      user.role     = role;
      await user.save({ validateBeforeSave: false });

      // Auto-create volunteer profile if promoted to volunteer
      if (role === "volunteer" && oldRole !== "volunteer") {
        const exists = await Volunteer.findOne({ user: user._id });
        if (!exists) {
          await Volunteer.create({ user: user._id });
        }
      }

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/users/:id — hard delete a user (admin only)
router.delete(
  "/users/:id",
  protect,
  restrictTo("admin"),
  async (req, res, next) => {
    try {
      const User = (await import("../models/User.model.js")).default;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot delete another admin account",
        });
      }

      await user.deleteOne();

      res.status(200).json({
        success: true,
        message: "User permanently deleted",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;