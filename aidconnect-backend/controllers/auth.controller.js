// controllers/auth.controller.js

import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.model.js";
import Volunteer from "../models/Volunteer.model.js";

// ─── Helper: Generate Access Token (short-lived) ─────────────────────────────
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

// ─── Helper: Generate Refresh Token (long-lived) ─────────────────────────────
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

// ─── Helper: Send tokens as HTTP-only cookies + response ─────────────────────
// refreshToken is now passed in — never regenerated here
const sendTokenResponse = (user, statusCode, res, message = "Success", refreshToken) => {
  const accessToken = generateAccessToken(user._id, user.role);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      success: true,
      message,
      accessToken,
      user: user.toPublicJSON(),
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, bloodGroup, location } = req.body;

    // 1. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // 2. Prevent registering directly as admin
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created via registration",
      });
    }

    // 3. Create the user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
      phone,
      bloodGroup,
      location,
    });

    // 4. If registering as volunteer → auto-create a Volunteer profile
    if (user.role === "volunteer") {
      await Volunteer.create({
        user: user._id,
        serviceArea: location
          ? {
              city: location.city,
              area: location.area,
              coordinates: location.coordinates,
            }
          : {},
      });
    }

    // 5. Generate refresh token once, save to DB, send in cookie
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 201, res, "Account created successfully", refreshToken);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user and explicitly select password (it's select:false in schema)
    const user = await User.findOne({ email }).select("+password +refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check if banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.bannedReason || "Violation of terms"}`,
      });
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // 5. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 6. Update last login
    user.lastLogin = new Date();

    // 7. Generate refresh token once, save to DB, send in cookie
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Login successful", refreshToken);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token from DB
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    // Clear cookies
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/refresh-token
// @access  Public (uses refresh token cookie)
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    // Get token from cookie or body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token. Please login again.",
      });
    }

    // Find user and check stored refresh token matches
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch. Please login again.",
      });
    }

    if (user.isBanned || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is banned or inactive.",
      });
    }

    // Issue new access token only (rolling refresh)
    const newAccessToken = generateAccessToken(user._id, user.role);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Token refreshed",
        accessToken: newAccessToken,
      });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If volunteer, attach volunteer profile too
    let volunteerProfile = null;
    if (user.role === "volunteer") {
      volunteerProfile = await Volunteer.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
      volunteerProfile: volunteerProfile || undefined,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/update-profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bloodGroup, location, notificationPreferences } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;
    if (location) updates.location = location;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/auth/delete-account
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    if (user.role === "volunteer") {
      await Volunteer.findOneAndUpdate(
        { user: user._id },
        { isAvailable: false, isSuspended: true, suspendedReason: "Account deactivated" }
      );
    }

    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json({
        success: true,
        message: "Account deactivated successfully",
      });
  } catch (error) {
    next(error);
  }
};