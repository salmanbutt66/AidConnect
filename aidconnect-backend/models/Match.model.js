// models/Match.model.js
// Records every match between a help request and a volunteer/provider
//
// WHY THIS EXISTS AS A SEPARATE COLLECTION:
// When a request is posted, the matching engine finds
// the top 5 nearby volunteers and notifies all of them
// We need to track each notification separately:
//   - Who was notified?
//   - Did they accept or decline?
//   - How fast did they respond?
//   - If they declined, who was notified next?
//
// Example: Request #1 is posted
//   Match 1: Request #1 → Volunteer A (notified, then accepted)
//   Match 2: Request #1 → Volunteer B (notified, then declined)
//   Match 3: Request #1 → Volunteer C (notified, then expired)

const mongoose = require("mongoose");

// ─────────────────────────────────────────
// MATCH SCHEMA
// ─────────────────────────────────────────
const matchSchema = new mongoose.Schema(
  {
    // ── WHICH REQUEST ──────────────────────
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: [true, "Request ID is required"],
    },

    // ── WHO WAS MATCHED ────────────────────
    // Can be either a Volunteer or Provider
    matchedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "matchedType",   // dynamic ref based on matchedType
      required: [true, "Matched user ID is required"],
    },

    // Which collection matchedTo points to
    matchedType: {
      type: String,
      enum: {
        values: ["Volunteer", "Provider"],
        message: "{VALUE} is not a valid match type",
      },
      required: [true, "Match type is required"],
    },

    // ── MATCH QUALITY SCORE ────────────────
    // How good is this match? 0-100
    // Calculated by matching engine based on:
    //   - Distance from request (closer = higher score)
    //   - Volunteer reliability score (higher = better)
    //   - Blood group compatibility (if blood request)
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ── DISTANCE ───────────────────────────
    // How far is this volunteer/provider from the request
    // Stored so we don't recalculate every time
    distanceKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ── MATCH STATUS ───────────────────────
    // Lifecycle of each individual match notification:
    // notified → volunteer was sent a notification
    // accepted → volunteer accepted the request
    // declined → volunteer declined
    // expired  → volunteer didn't respond in time
    status: {
      type: String,
      enum: {
        values: ["notified", "accepted", "declined", "expired"],
        message: "{VALUE} is not a valid match status",
      },
      default: "notified",
    },

    // ── TIMING ─────────────────────────────
    // When was this match created (notification sent)
    notifiedAt: {
      type: Date,
      default: Date.now,
    },

    // When did the volunteer respond (accept or decline)
    respondedAt: {
      type: Date,
      default: null,
    },

    // ── RESPONSE TIME ──────────────────────
    // Minutes from notifiedAt to respondedAt
    // Used in volunteer performance analytics
    responseTimeMinutes: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,   // auto adds createdAt and updatedAt
  }
);

// ─────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────

// Find all matches for a specific request
// Used when checking who was notified for a request
matchSchema.index({ requestId: 1, status: 1 });

// Find all matches for a specific volunteer
// Used in volunteer dashboard to see their notifications
matchSchema.index({ matchedTo: 1, status: 1 });

// Find all pending notifications for a volunteer
// Used to show volunteer their unresponded matches
matchSchema.index({ matchedTo: 1, matchedType: 1, status: 1 });

// ─────────────────────────────────────────
// PRE-SAVE MIDDLEWARE
// Calculates responseTimeMinutes automatically
// when a volunteer responds to a match
// ─────────────────────────────────────────
matchSchema.pre("save", function (next) {
  // If respondedAt was just set and we have notifiedAt
  if (
    this.isModified("respondedAt") &&
    this.respondedAt &&
    this.notifiedAt
  ) {
    // Calculate response time in minutes
    const diffMs = this.respondedAt - this.notifiedAt;
    this.responseTimeMinutes = Math.round(diffMs / 1000 / 60);
  }
  next();
});

// ─────────────────────────────────────────
// STATIC METHOD — getRequestMatches
// Get all matches for a specific request
// with volunteer/provider details populated
// ─────────────────────────────────────────
matchSchema.statics.getRequestMatches = async function (requestId) {
  return await this.find({ requestId })
    .populate("matchedTo")          // populate volunteer/provider details
    .populate("requestId")          // populate request details
    .sort({ matchScore: -1 });      // highest score first
};

// ─────────────────────────────────────────
// STATIC METHOD — getVolunteerMatches
// Get all match notifications for a volunteer
// sorted by most recent first
// ─────────────────────────────────────────
matchSchema.statics.getVolunteerMatches = async function (volunteerId) {
  return await this.find({
    matchedTo: volunteerId,
    status: "notified",             // only pending notifications
  })
    .populate("requestId")          // get full request details
    .sort({ notifiedAt: -1 });      // most recent first
};

const Match = mongoose.model("Match", matchSchema);

module.exports = Match;