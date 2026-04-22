// models/Match.model.js
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    // ── WHICH REQUEST ──────────────────────
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: [true, "Request ID is required"],
    },

    // ── WHO WAS MATCHED ────────────────────
    matchedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "matchedType",
      required: [true, "Matched user ID is required"],
    },

    matchedType: {
      type: String,
      enum: {
        values: ["Volunteer", "Provider"],
        message: "{VALUE} is not a valid match type",
      },
      required: [true, "Match type is required"],
    },

    // ── MATCH QUALITY SCORE ────────────────
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ── DISTANCE ───────────────────────────
    distanceKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ── MATCH STATUS ───────────────────────
    status: {
      type: String,
      enum: {
        values: ["notified", "accepted", "declined", "expired"],
        message: "{VALUE} is not a valid match status",
      },
      default: "notified",
    },

    // ── TIMING ─────────────────────────────
    notifiedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    // ── RESPONSE TIME ──────────────────────
    responseTimeMinutes: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
matchSchema.index({ requestId: 1, status: 1 });
matchSchema.index({ matchedTo: 1, status: 1 });
matchSchema.index({ matchedTo: 1, matchedType: 1, status: 1 });

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
matchSchema.pre("save", function (next) {
  if (
    this.isModified("respondedAt") &&
    this.respondedAt &&
    this.notifiedAt
  ) {
    const diffMs = this.respondedAt - this.notifiedAt;
    this.responseTimeMinutes = Math.round(diffMs / 1000 / 60);
  }
  next();
});

// ─── Static Methods ───────────────────────────────────────────────────────────
matchSchema.statics.getRequestMatches = async function (requestId) {
  return await this.find({ requestId })
    .populate("matchedTo")
    .populate("requestId")
    .sort({ matchScore: -1 });
};

matchSchema.statics.getVolunteerMatches = async function (volunteerId) {
  return await this.find({
    matchedTo: volunteerId,
    status: "notified",
  })
    .populate("requestId")
    .sort({ notifiedAt: -1 });
};

const Match = mongoose.model("Match", matchSchema);
export default Match; 