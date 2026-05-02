// controllers/auth.controller.js
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Volunteer from "../models/Volunteer.model.js";

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

const sendTokenResponse = (user, statusCode, res, message = "Success", refreshToken) => {
  const accessToken = generateAccessToken(user._id, user.role);

  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
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
//
// FIX SUMMARY:
// 1. `city` is read as a flat top-level field (what Register.jsx sends).
// 2. It is stored in user.location.city so /api/auth/me returns it and
//    HelpRequestForm can pre-fill the city dropdown.
// 3. When role === "volunteer", a Volunteer profile is created immediately
//    with serviceArea.city set to the resolved city. Without this, new
//    volunteers had serviceArea.city = null and were never matched.
// 4. Provider registration does NOT create a Volunteer profile — providers
//    register their org separately via POST /api/providers/register.
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const {
      name, email, password, role,
      phone, bloodGroup,
      city,     // flat field sent by Register.jsx
      location, // nested object (future-proofing / API consumers)
    } = req.body;

    // ── Duplicate check ────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // ── Block admin self-registration ──────────────────────────────────────
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created via registration",
      });
    }

    // ── Resolve city ───────────────────────────────────────────────────────
    // Flat `city` from Register.jsx takes precedence over nested location.city.
    const resolvedCity = city?.trim() || location?.city?.trim() || null;

    // ── Create user ────────────────────────────────────────────────────────
    // Store city in user.location.city so the auth/me response includes it.
    // HelpRequestForm reads this to pre-fill the city dropdown for users.
    const user = await User.create({
      name:       name?.trim(),
      email:      email?.toLowerCase().trim(),
      password,
      role:       role || "user",
      phone:      phone || undefined,
      bloodGroup: bloodGroup || undefined,
      location:   resolvedCity
        ? { city: resolvedCity, area: location?.area || null }
        : (location || undefined),
    });

    // ── Seed Volunteer profile ─────────────────────────────────────────────
    // FIX: create the Volunteer profile at registration time with serviceArea.city
    // pre-populated. Without this, getNearbyRequests returns nothing because it
    // filters on volunteer.serviceArea.city which would otherwise be null.
    //
    // isApproved stays false (default) — admin must approve before the volunteer
    // can toggle availability. isAvailable also stays false (default) so the
    // volunteer won't be matched until they manually go available after approval.
    if (user.role === "volunteer") {
      const existing = await Volunteer.findOne({ user: user._id });
      if (!existing) {
        await Volunteer.create({
          user: user._id,
          serviceArea: {
            city:     resolvedCity || null,
            area:     location?.area || null,
            radiusKm: 10,
          },
          // isAvailable: false  ← Mongoose default, no need to set explicitly
          // isApproved:  false  ← Mongoose default
        });
      }
    }

    // ── Issue tokens ───────────────────────────────────────────────────────
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
    user.lastLogin     = new Date();
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+password +refreshToken");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.bannedReason || "Violation of terms"}`,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.lastLogin    = new Date();
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
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
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/refresh-token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token. Please login again.",
      });
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch. Please login again.",
      });
    }

    if (user.isBanned || !user.isActive) {
      return res.status(403).json({ success: false, message: "Account is banned or inactive." });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   15 * 60 * 1000,
      })
      .status(200)
      .json({ success: true, message: "Token refreshed", accessToken: newAccessToken });
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let volunteerProfile = null;
    if (user.role === "volunteer") {
      volunteerProfile = await Volunteer.findOne({ user: user._id })
        .select("serviceArea isApproved isAvailable isSuspended reputationScore");
    }

    res.status(200).json({
      success:          true,
      user:             user.toPublicJSON(),
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
    if (name !== undefined)                    updates.name     = name;
    if (phone !== undefined)                   updates.phone    = phone;
    if (bloodGroup !== undefined)              updates.bloodGroup = bloodGroup;
    if (location !== undefined)                updates.location = location;
    if (notificationPreferences !== undefined) updates.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user:    user.toPublicJSON(),
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
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
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

    user.isActive     = false;
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
      .json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    next(error);
  }
};