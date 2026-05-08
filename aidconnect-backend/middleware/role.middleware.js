
import Volunteer from "../models/Volunteer.model.js";
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
    req.volunteerProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};
export const requireAvailableVolunteer = (req, res, next) => {
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
export const requireAnyOf = (...roles) => restrictTo(...roles);
export const ROLES = {
  USER:      "user",
  VOLUNTEER: "volunteer",
  PROVIDER:  "provider",
  ADMIN:     "admin",
};