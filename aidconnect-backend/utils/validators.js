// utils/validators.js

// ─────────────────────────────────────────────────────────────────────────────
// AidConnect — Backend Validators
// Used as Express middleware in routes AND as standalone helper functions
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — shared enums matching Mongoose schema definitions
// Import these in frontend too for consistency
// ─────────────────────────────────────────────────────────────────────────────
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EMERGENCY_TYPES = [
  "medical",
  "fire",
  "flood",
  "earthquake",
  "accident",
  "blood_request",
  "food_shortage",
  "mental_health",
  "missing_person",
  "other",
];

export const VOLUNTEER_SKILLS = [
  "first_aid",
  "firefighting",
  "rescue",
  "medical",
  "counseling",
  "logistics",
  "driving",
  "blood_donation",
  "food_distribution",
  "shelter_setup",
  "translation",
  "it_support",
  "other",
];

export const URGENCY_LEVELS = ["low", "medium", "high", "critical"];

export const REQUEST_STATUSES = [
  "posted",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
];

export const USER_ROLES = ["user", "volunteer", "provider", "admin"];

export const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Larkana",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Dera Ghazi Khan",
];

// ─────────────────────────────────────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────────────────────────────────────
const PATTERNS = {
  email:    /^\S+@\S+\.\S+$/,
  phone:    /^(\+92|0)[0-9]{10}$/,       // Pakistani phone: +923001234567 or 03001234567
  cnic:     /^\d{5}-\d{7}-\d{1}$/,       // Pakistani CNIC: XXXXX-XXXXXXX-X
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // min 8, 1 upper, 1 lower, 1 digit
  objectId: /^[a-fA-F0-9]{24}$/,         // MongoDB ObjectId
  url:      /^https?:\/\/.+\..+/,
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE HELPER — builds a clean error response and stops the chain
// ─────────────────────────────────────────────────────────────────────────────
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STANDALONE HELPERS — use these anywhere (not just middleware)
// ─────────────────────────────────────────────────────────────────────────────

export const isValidEmail = (email) =>
  typeof email === "string" && PATTERNS.email.test(email.trim());

export const isValidPhone = (phone) =>
  typeof phone === "string" && PATTERNS.phone.test(phone.trim());

export const isValidCNIC = (cnic) =>
  typeof cnic === "string" && PATTERNS.cnic.test(cnic.trim());

export const isValidPassword = (password) =>
  typeof password === "string" && PATTERNS.password.test(password);

export const isValidObjectId = (id) =>
  typeof id === "string" && PATTERNS.objectId.test(id);

export const isValidBloodGroup = (bg) =>
  BLOOD_GROUPS.includes(bg);

export const isValidEmergencyType = (type) =>
  EMERGENCY_TYPES.includes(type);

export const isValidUrgencyLevel = (level) =>
  URGENCY_LEVELS.includes(level);

export const isValidRole = (role) =>
  USER_ROLES.includes(role);

export const isValidUrl = (url) =>
  typeof url === "string" && PATTERNS.url.test(url);

export const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;

export const isInRange = (val, min, max) =>
  typeof val === "number" && val >= min && val <= max;

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeString — trim + collapse whitespace
// ─────────────────────────────────────────────────────────────────────────────
export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.trim().replace(/\s+/g, " ");
};

// ─────────────────────────────────────────────────────────────────────────────
// validateRegister — POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const validateRegister = (req, res, next) => {
  const errors = [];
  const { name, email, password, role, phone, bloodGroup } = req.body;

  // name
  if (!name || !isNonEmptyString(name)) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  } else if (name.trim().length > 50) {
    errors.push({ field: "name", message: "Name cannot exceed 50 characters" });
  }

  // email
  if (!email || !isNonEmptyString(email)) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Please provide a valid email address" });
  }

  // password
  if (!password) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  } else if (!isValidPassword(password)) {
    errors.push({
      field: "password",
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }

  // role (optional — defaults to "user" in controller)
  if (role && !isValidRole(role)) {
    errors.push({
      field: "role",
      message: `Invalid role. Allowed roles: ${USER_ROLES.filter((r) => r !== "admin").join(", ")}`,
    });
  }

  // phone (optional but validate format if provided)
  if (phone && !isValidPhone(phone)) {
    errors.push({
      field: "phone",
      message: "Phone must be a valid Pakistani number (e.g. 03001234567 or +923001234567)",
    });
  }

  // bloodGroup (optional but validate if provided)
  if (bloodGroup && !isValidBloodGroup(bloodGroup)) {
    errors.push({
      field: "bloodGroup",
      message: `Invalid blood group. Valid options: ${BLOOD_GROUPS.join(", ")}`,
    });
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateLogin — POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || !isNonEmptyString(email)) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Please provide a valid email address" });
  }

  if (!password || !isNonEmptyString(password)) {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateUpdateProfile — PUT /api/auth/update-profile
// ─────────────────────────────────────────────────────────────────────────────
export const validateUpdateProfile = (req, res, next) => {
  const errors = [];
  const { name, phone, bloodGroup, location } = req.body;

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      errors.push({ field: "name", message: "Name cannot be empty" });
    } else if (name.trim().length < 2) {
      errors.push({ field: "name", message: "Name must be at least 2 characters" });
    } else if (name.trim().length > 50) {
      errors.push({ field: "name", message: "Name cannot exceed 50 characters" });
    }
  }

  if (phone !== undefined && phone !== null && phone !== "") {
    if (!isValidPhone(phone)) {
      errors.push({
        field: "phone",
        message: "Phone must be a valid Pakistani number",
      });
    }
  }

  if (bloodGroup !== undefined && bloodGroup !== null) {
    if (!isValidBloodGroup(bloodGroup)) {
      errors.push({
        field: "bloodGroup",
        message: `Invalid blood group. Valid options: ${BLOOD_GROUPS.join(", ")}`,
      });
    }
  }

  if (location !== undefined) {
    if (typeof location !== "object" || Array.isArray(location)) {
      errors.push({ field: "location", message: "Location must be an object" });
    } else {
      if (location.coordinates) {
        const { lat, lng } = location.coordinates;
        if (lat !== undefined && !isInRange(lat, -90, 90)) {
          errors.push({ field: "location.coordinates.lat", message: "Latitude must be between -90 and 90" });
        }
        if (lng !== undefined && !isInRange(lng, -180, 180)) {
          errors.push({ field: "location.coordinates.lng", message: "Longitude must be between -180 and 180" });
        }
      }
    }
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateChangePassword — PUT /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
export const validateChangePassword = (req, res, next) => {
  const errors = [];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !isNonEmptyString(currentPassword)) {
    errors.push({ field: "currentPassword", message: "Current password is required" });
  }

  if (!newPassword) {
    errors.push({ field: "newPassword", message: "New password is required" });
  } else if (newPassword.length < 6) {
    errors.push({ field: "newPassword", message: "New password must be at least 6 characters" });
  } else if (!isValidPassword(newPassword)) {
    errors.push({
      field: "newPassword",
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }

  if (
    currentPassword &&
    newPassword &&
    currentPassword === newPassword
  ) {
    errors.push({
      field: "newPassword",
      message: "New password must be different from current password",
    });
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateVolunteerProfile — PUT /api/volunteers/profile
// ─────────────────────────────────────────────────────────────────────────────
export const validateVolunteerProfile = (req, res, next) => {
  const errors = [];
  const {
    bio,
    skills,
    emergencyTypes,
    cnic,
    serviceArea,
    radiusKm,
    lastDonationDate,
  } = req.body;

  if (bio !== undefined) {
    if (typeof bio !== "string") {
      errors.push({ field: "bio", message: "Bio must be a string" });
    } else if (bio.length > 500) {
      errors.push({ field: "bio", message: "Bio cannot exceed 500 characters" });
    }
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      errors.push({ field: "skills", message: "Skills must be an array" });
    } else {
      const invalid = skills.filter((s) => !VOLUNTEER_SKILLS.includes(s));
      if (invalid.length > 0) {
        errors.push({
          field: "skills",
          message: `Invalid skills: ${invalid.join(", ")}. Valid: ${VOLUNTEER_SKILLS.join(", ")}`,
        });
      }
    }
  }

  if (emergencyTypes !== undefined) {
    if (!Array.isArray(emergencyTypes)) {
      errors.push({ field: "emergencyTypes", message: "Emergency types must be an array" });
    } else {
      const invalid = emergencyTypes.filter((t) => !EMERGENCY_TYPES.includes(t));
      if (invalid.length > 0) {
        errors.push({
          field: "emergencyTypes",
          message: `Invalid types: ${invalid.join(", ")}`,
        });
      }
    }
  }

  if (cnic !== undefined && cnic !== null && cnic !== "") {
    if (!isValidCNIC(cnic)) {
      errors.push({
        field: "cnic",
        message: "CNIC format must be XXXXX-XXXXXXX-X (e.g. 37405-1234567-9)",
      });
    }
  }

  if (radiusKm !== undefined) {
    const r = Number(radiusKm);
    if (isNaN(r) || !isInRange(r, 1, 100)) {
      errors.push({
        field: "radiusKm",
        message: "Service radius must be between 1 and 100 km",
      });
    }
  }

  if (serviceArea !== undefined) {
    if (serviceArea.coordinates) {
      const { lat, lng } = serviceArea.coordinates;
      if (lat !== undefined && !isInRange(Number(lat), -90, 90)) {
        errors.push({ field: "serviceArea.coordinates.lat", message: "Invalid latitude" });
      }
      if (lng !== undefined && !isInRange(Number(lng), -180, 180)) {
        errors.push({ field: "serviceArea.coordinates.lng", message: "Invalid longitude" });
      }
    }
  }

  if (lastDonationDate !== undefined && lastDonationDate !== null) {
    const date = new Date(lastDonationDate);
    if (isNaN(date.getTime())) {
      errors.push({ field: "lastDonationDate", message: "Invalid date format" });
    } else if (date > new Date()) {
      errors.push({ field: "lastDonationDate", message: "Last donation date cannot be in the future" });
    }
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateHelpRequest — POST /api/requests (for Haseeb's module)
// ─────────────────────────────────────────────────────────────────────────────
export const validateHelpRequest = (req, res, next) => {
  const errors = [];
  const {
    title,
    description,
    emergencyType,
    urgencyLevel,
    location,
    bloodGroupNeeded,
  } = req.body;

  if (!title || !isNonEmptyString(title)) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (title.trim().length < 5) {
    errors.push({ field: "title", message: "Title must be at least 5 characters" });
  } else if (title.trim().length > 100) {
    errors.push({ field: "title", message: "Title cannot exceed 100 characters" });
  }

  if (!description || !isNonEmptyString(description)) {
    errors.push({ field: "description", message: "Description is required" });
  } else if (description.trim().length < 10) {
    errors.push({ field: "description", message: "Description must be at least 10 characters" });
  } else if (description.trim().length > 1000) {
    errors.push({ field: "description", message: "Description cannot exceed 1000 characters" });
  }

  if (!emergencyType || !isValidEmergencyType(emergencyType)) {
    errors.push({
      field: "emergencyType",
      message: `Invalid emergency type. Valid: ${EMERGENCY_TYPES.join(", ")}`,
    });
  }

  if (!urgencyLevel || !isValidUrgencyLevel(urgencyLevel)) {
    errors.push({
      field: "urgencyLevel",
      message: `Invalid urgency level. Valid: ${URGENCY_LEVELS.join(", ")}`,
    });
  }

  if (!location || typeof location !== "object") {
    errors.push({ field: "location", message: "Location is required" });
  } else {
    if (!location.city || !isNonEmptyString(location.city)) {
      errors.push({ field: "location.city", message: "City is required" });
    }
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;
      if (lat !== undefined && !isInRange(Number(lat), -90, 90)) {
        errors.push({ field: "location.coordinates.lat", message: "Invalid latitude" });
      }
      if (lng !== undefined && !isInRange(Number(lng), -180, 180)) {
        errors.push({ field: "location.coordinates.lng", message: "Invalid longitude" });
      }
    }
  }

  if (bloodGroupNeeded && !isValidBloodGroup(bloodGroupNeeded)) {
    errors.push({
      field: "bloodGroupNeeded",
      message: `Invalid blood group. Valid: ${BLOOD_GROUPS.join(", ")}`,
    });
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateRating — POST /api/volunteers/:id/rate
// ─────────────────────────────────────────────────────────────────────────────
export const validateRating = (req, res, next) => {
  const errors = [];
  const { score, comment, requestId } = req.body;

  if (score === undefined || score === null) {
    errors.push({ field: "score", message: "Score is required" });
  } else {
    const s = Number(score);
    if (isNaN(s) || !isInRange(s, 1, 5)) {
      errors.push({ field: "score", message: "Score must be a number between 1 and 5" });
    }
  }

  if (!requestId || !isValidObjectId(requestId)) {
    errors.push({ field: "requestId", message: "A valid requestId is required" });
  }

  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      errors.push({ field: "comment", message: "Comment must be a string" });
    } else if (comment.length > 300) {
      errors.push({ field: "comment", message: "Comment cannot exceed 300 characters" });
    }
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// validateObjectIdParam — reusable param validator
// Usage: router.get("/:id", validateObjectIdParam("id"), handler)
// ─────────────────────────────────────────────────────────────────────────────
export const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!isValidObjectId(value)) {
      return validationError(res, [
        {
          field: paramName,
          message: `Invalid ${paramName}: "${value}" is not a valid ID`,
        },
      ]);
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// validatePagination — reusable query param validator for paginated routes
// ─────────────────────────────────────────────────────────────────────────────
export const validatePagination = (req, res, next) => {
  const errors = [];
  const { page, limit } = req.query;

  if (page !== undefined) {
    const p = Number(page);
    if (isNaN(p) || p < 1 || !Number.isInteger(p)) {
      errors.push({ field: "page", message: "Page must be a positive integer" });
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (isNaN(l) || l < 1 || l > 100 || !Number.isInteger(l)) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 100" });
    }
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};