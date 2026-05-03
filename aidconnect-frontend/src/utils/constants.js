// src/utils/constants.js

// ─── Blood Groups ─────────────────────────────────────
export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

// ─── Emergency Types ──────────────────────────────────
export const EMERGENCY_TYPES = [
  { value: "medical",  label: "Medical"  },
  { value: "blood",    label: "Blood"    },
  { value: "accident", label: "Accident" },
  { value: "disaster", label: "Disaster" },
  { value: "other",    label: "Other"    },
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
  { value: "user",      label: "Citizen"      },
  { value: "volunteer", label: "Volunteer"    },
  { value: "provider",  label: "Organization" },
  { value: "admin",     label: "Admin"        },
];

// ─── Provider Service Types ───────────────────────────
export const SERVICE_TYPES = [
  { value: "ambulance",  label: "Ambulance"  },
  { value: "hospital",   label: "Hospital"   },
  { value: "blood_bank", label: "Blood Bank" },
  { value: "rescue",     label: "Rescue"     },
  { value: "ngo",        label: "NGO"        },
  { value: "other",      label: "Other"      },
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
  new_request:       { label: "New Request"       },
  request_accepted:  { label: "Request Accepted"  },
  request_completed: { label: "Request Completed" },
  request_cancelled: { label: "Request Cancelled" },
  account_verified:  { label: "Account Verified"  },
  disaster_alert:    { label: "Disaster Alert"    },
};

// ─── Pagination ───────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── App Info ─────────────────────────────────────────
export const APP_NAME    = "AidConnect";
export const APP_TAGLINE = "Pakistan's Emergency Coordination Platform";