// src/utils/formatters.js

// ─── Date Formatters ──────────────────────────────────

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
};

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

export const formatTimeAgo = (date) => {
  if (!date) return "—";
  const now     = new Date();
  const past    = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 0)      return "just now";
  if (seconds < 60)     return "just now";
  if (seconds < 3600)   return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ─── Name Formatters ──────────────────────────────────

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

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

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

// Kept for backward compatibility — returns empty string so nothing renders
// Icons are now handled by Lucide components in each card/table
export const getEmergencyEmoji = (_type) => "";

export const formatUrgency = (level) => {
  const levels = {
    low:      "Low",
    medium:   "Medium",
    high:     "High",
    critical: "Critical",
  };
  return levels[level] || capitalize(level);
};

export const getUrgencyClass = (level) => {
  const classes = {
    low:      "urgency-low",
    medium:   "urgency-medium",
    high:     "urgency-high",
    critical: "urgency-critical",
  };
  return classes[level] || "badge-stone";
};

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

export const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000)    return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

export const formatPercent = (value, decimals = 1) => {
  if (!value && value !== 0) return "0%";
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatDistance = (km) => {
  if (!km && km !== 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

export const formatScore = (score) => {
  if (score === null || score === undefined) return { label: "N/A", color: "stone" };
  if (score >= 85) return { label: "Elite",      color: "green"  };
  if (score >= 70) return { label: "Trusted",    color: "green"  };
  if (score >= 55) return { label: "Reliable",   color: "blue"   };
  if (score >= 40) return { label: "Developing", color: "orange" };
  return               { label: "At Risk",     color: "red"    };
};

// ─── Phone Formatter ──────────────────────────────────

export const formatPhone = (phone) => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
};

// ─── Rating Formatter ─────────────────────────────────

export const formatStars = (rating, max = 5) => {
  const filled = Math.floor((rating || 0) + 0.5);
  return Array.from({ length: max }, (_, i) => i < filled);
};