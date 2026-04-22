// src/utils/constants.js

// ─── Blood Groups ─────────────────────────────────────
export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

// ─── Emergency Types ──────────────────────────────────
export const EMERGENCY_TYPES = [
  { value: "medical",        label: "Medical",         emoji: "🏥" },
  { value: "blood",          label: "Blood",           emoji: "🩸" },
  { value: "accident",       label: "Accident",        emoji: "🚗" },
  { value: "disaster",       label: "Disaster",        emoji: "🌊" },
  { value: "other",          label: "Other",           emoji: "🆘" },
];

// ─── Urgency Levels ───────────────────────────────────
export const URGENCY_LEVELS = [
  { value: "low",      label: "Low",      color: "green"  },
  { value: "medium",   label: "Medium",   color: "orange" },
  { value: "high",     label: "High",     color: "red"    },
  { value: "critical", label: "Critical", color: "red"    },
];

// ─── Request Statuses ─────────────────────────────────
export const REQUEST_STATUSES = [
  { value: "posted",      label: "Posted",      color: "blue"   },
  { value: "accepted",    label: "Accepted",    color: "orange" },
  { value: "in_progress", label: "In Progress", color: "orange" },
  { value: "completed",   label: "Completed",   color: "green"  },
  { value: "cancelled",   label: "Cancelled",   color: "stone"  },
];

// ─── User Roles ───────────────────────────────────────
export const USER_ROLES = [
  { value: "user",      label: "Citizen",      emoji: "👤" },
  { value: "volunteer", label: "Volunteer",    emoji: "🤝" },
  { value: "provider",  label: "Organization", emoji: "🏥" },
  { value: "admin",     label: "Admin",        emoji: "🛡️" },
];

// ─── Provider Service Types ───────────────────────────
export const SERVICE_TYPES = [
  { value: "ambulance",   label: "Ambulance",   emoji: "🚑" },
  { value: "hospital",    label: "Hospital",    emoji: "🏥" },
  { value: "blood_bank",  label: "Blood Bank",  emoji: "🩸" },
  { value: "rescue",      label: "Rescue",      emoji: "🚒" },
  { value: "ngo",         label: "NGO",         emoji: "🤝" },
  { value: "other",       label: "Other",       emoji: "🆘" },
];

// ─── Volunteer Skills ─────────────────────────────────
export const VOLUNTEER_SKILLS = [
  "first_aid", "firefighting", "rescue", "medical",
  "counseling", "logistics", "driving", "blood_donation",
  "food_distribution", "shelter_setup", "translation",
  "it_support", "other",
];

// ─── Pakistan Cities ──────────────────────────────────
export const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi",
  "Faisalabad", "Multan", "Peshawar", "Quetta",
  "Sialkot", "Gujranwala", "Hyderabad", "Abbottabad",
  "Bahawalpur", "Sargodha", "Sukkur", "Larkana",
  "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan",
];

// ─── Notification Types ───────────────────────────────
export const NOTIFICATION_TYPES = {
  new_request:       { label: "New Request",       emoji: "🆘" },
  request_accepted:  { label: "Request Accepted",  emoji: "✅" },
  request_completed: { label: "Request Completed", emoji: "🎉" },
  request_cancelled: { label: "Request Cancelled", emoji: "❌" },
  account_verified:  { label: "Account Verified",  emoji: "✅" },
  disaster_alert:    { label: "Disaster Alert",    emoji: "⚠️" },
};

// ─── Pagination ───────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── App Info ─────────────────────────────────────────
export const APP_NAME = "AidConnect";
export const APP_TAGLINE = "Pakistan's Emergency Coordination Platform";