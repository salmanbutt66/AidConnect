// src/utils/formatters.js

// ─── Date Formatters ──────────────────────────────────

// Format: "21 Apr 2026"
export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
};

// Format: "21 Apr 2026, 10:32 AM"
export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-PK", {
    day:    "numeric",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
};

// Format: "2 hours ago", "just now", "3 days ago"
export const formatTimeAgo = (date) => {
  if (!date) return "—";
  const now     = new Date();
  const past    = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  // FIX: guard against clock skew / future dates
  if (seconds < 0)      return "just now";
  if (seconds < 60)     return "just now";
  if (seconds < 3600)   return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

// Format minutes into human readable duration
// e.g. 75 → "1h 15m", 5 → "5m"
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ─── Name Formatters ──────────────────────────────────

// Get initials from name: "Muhammad Ali" → "MA"
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
};

// Capitalize first letter: "volunteer" → "Volunteer"
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format role for display: "volunteer" → "Volunteer"
export const formatRole = (role) => {
  const roles = {
    user:      "Citizen",
    volunteer: "Volunteer",
    provider:  "Organization",
    admin:     "Admin",
  };
  return roles[role] || capitalize(role);
};

// ─── Emergency Formatters ─────────────────────────────

// Format emergency type for display
export const formatEmergencyType = (type) => {
  const types = {
    medical:  "Medical",
    blood:    "Blood",
    accident: "Accident",
    disaster: "Disaster",
    other:    "Other",
  };
  return types[type] || capitalize(type);
};

// Get emergency type emoji
export const getEmergencyEmoji = (type) => {
  const emojis = {
    medical:  "🏥",
    blood:    "🩸",
    accident: "🚗",
    disaster: "🌊",
    other:    "🆘",
  };
  return emojis[type] || "🆘";
};

// Format urgency level for display
export const formatUrgency = (level) => {
  const levels = {
    low:      "Low",
    medium:   "Medium",
    high:     "High",
    critical: "Critical",
  };
  return levels[level] || capitalize(level);
};

// Get urgency badge/chip class
// FIX: now uses all four urgency-* chip classes from index.css consistently
// instead of mixing urgency-* and badge-* classes
export const getUrgencyClass = (level) => {
  const classes = {
    low:      "urgency-low",
    medium:   "urgency-medium",
    high:     "urgency-high",
    critical: "urgency-critical",
  };
  return classes[level] || "badge-stone";
};

// Format request status for display
export const formatStatus = (status) => {
  const statuses = {
    posted:      "Posted",
    accepted:    "Accepted",
    in_progress: "In Progress",
    completed:   "Completed",
    cancelled:   "Cancelled",
  };
  return statuses[status] || capitalize(status);
};

// Get status badge class
export const getStatusClass = (status) => {
  const classes = {
    posted:      "badge-blue",
    accepted:    "badge-orange",
    in_progress: "badge-orange",
    completed:   "badge-green",
    cancelled:   "badge-stone",
  };
  return classes[status] || "badge-stone";
};

// ─── Number Formatters ────────────────────────────────

// Format large numbers: 1200 → "1.2k"
export const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000)    return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

// Format percentage.
// FIX: expects a value already in percent (0–100), not a decimal (0–1).
// Backend sends reputationScore, acceptanceRate, completionRate as 0–100.
// Pass raw percent: formatPercent(85.6) → "85.6%"
// If you have a decimal (0–1) from elsewhere, multiply by 100 before calling.
export const formatPercent = (value, decimals = 1) => {
  if (!value && value !== 0) return "0%";
  return `${Number(value).toFixed(decimals)}%`;
};

// Format distance: 1.5 → "1.5 km", 0.3 → "300 m"
export const formatDistance = (km) => {
  if (!km && km !== 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

// Format reputation score with label and color
// FIX: added null/undefined guard — missing score no longer silently shows "At Risk"
export const formatScore = (score) => {
  if (score === null || score === undefined) return { label: "N/A", color: "stone" };
  if (score >= 85) return { label: "Elite",      color: "green"  };
  if (score >= 70) return { label: "Trusted",    color: "green"  };
  if (score >= 55) return { label: "Reliable",   color: "blue"   };
  if (score >= 40) return { label: "Developing", color: "orange" };
  return               { label: "At Risk",     color: "red"    };
};

// ─── Phone Formatter ──────────────────────────────────
// Format: "03001234567" → "0300-1234567"
export const formatPhone = (phone) => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
};

// ─── Rating Formatter ─────────────────────────────────
// Returns array of filled/empty stars
// FIX: use Math.floor(x + 0.5) for consistent rounding across all JS engines
export const formatStars = (rating, max = 5) => {
  const filled = Math.floor((rating || 0) + 0.5);
  return Array.from({ length: max }, (_, i) => i < filled);
};