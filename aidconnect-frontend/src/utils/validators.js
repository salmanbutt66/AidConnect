// src/utils/validators.js
// Frontend validation helpers
// These mirror backend validators but run client-side for instant feedback

// ─── Regex Patterns ───────────────────────────────────
const PATTERNS = {
  email:    /^\S+@\S+\.\S+$/,
  phone:    /^(\+92|0)[0-9]{10}$/,
  cnic:     /^\d{5}-\d{7}-\d{1}$/,
  // FIX: was .{6,} — changed to .{8,} to match the 8-character minimum
  // enforced in validateRegister and validateChangePassword
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  objectId: /^[a-fA-F0-9]{24}$/,
};

// ─── Field Validators ─────────────────────────────────
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

export const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;

export const isInRange = (val, min, max) =>
  typeof val === "number" && val >= min && val <= max;

// ─── Form Validators ──────────────────────────────────
// Returns object of field errors
// Empty object means valid

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email || !isValidEmail(email))
    errors.email = "Please enter a valid email address";
  if (!password || !isNonEmptyString(password))
    errors.password = "Password is required";
  return errors;
};

export const validateRegister = ({
  name,
  email,
  password,
  confirmPassword,
  phone,
  // FIX: removed bloodGroup from destructure — it was accepted but never
  // validated, which was misleading. bloodGroup is optional on the backend
  // and has no validation rule to enforce here.
}) => {
  const errors = {};

  if (!name || name.trim().length < 2)
    errors.name = "Full name must be at least 2 characters";

  if (!email || !isValidEmail(email))
    errors.email = "Please enter a valid email address";

  if (!password)
    errors.password = "Password is required";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters";
  else if (!isValidPassword(password))
    errors.password = "Must contain uppercase, lowercase and a number";

  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  if (phone && !isValidPhone(phone))
    errors.phone = "Format: 03001234567 or +923001234567";

  return errors;
};

export const validateHelpRequest = ({
  emergencyType,
  urgencyLevel,
  description,
  longitude,
  latitude,
}) => {
  const errors = {};

  if (!emergencyType)
    errors.emergencyType = "Please select an emergency type";

  if (!urgencyLevel)
    errors.urgencyLevel = "Please select urgency level";

  if (!description || description.trim().length < 10)
    errors.description = "Description must be at least 10 characters";

  if (description && description.trim().length > 1000)
    errors.description = "Description cannot exceed 1000 characters";

  // FIX: was (!longitude || !latitude) which fails when coords are 0 (falsy)
  // e.g. longitude = 0 is valid (Prime Meridian). Use null/undefined check instead.
  if (longitude == null || latitude == null)
    errors.location = "Location is required";

  return errors;
};

export const validateProfile = ({ name, phone }) => {
  const errors = {};

  if (name !== undefined) {
    if (!name || name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";
    if (name && name.trim().length > 50)
      errors.name = "Name cannot exceed 50 characters";
  }

  if (phone && !isValidPhone(phone))
    errors.phone = "Format: 03001234567 or +923001234567";

  return errors;
};

export const validateChangePassword = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const errors = {};

  if (!currentPassword)
    errors.currentPassword = "Current password is required";

  if (!newPassword)
    errors.newPassword = "New password is required";
  else if (newPassword.length < 8)
    errors.newPassword = "Must be at least 8 characters";
  else if (!isValidPassword(newPassword))
    errors.newPassword = "Must contain uppercase, lowercase and a number";

  if (currentPassword && newPassword && currentPassword === newPassword)
    errors.newPassword = "New password must be different from current";

  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your new password";
  else if (newPassword !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  return errors;
};

export const validateRating = ({ rating, comment }) => {
  const errors = {};

  if (!rating || rating < 1 || rating > 5)
    errors.rating = "Rating must be between 1 and 5";

  if (comment && comment.length > 300)
    errors.comment = "Comment cannot exceed 300 characters";

  return errors;
};

// ─── Helper: Has Errors ───────────────────────────────
// Quick check if validation returned any errors
export const hasErrors = (errors) =>
  Object.keys(errors).length > 0;

// ─── Helper: Sanitize String ──────────────────────────
export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.trim().replace(/\s+/g, " ");
};