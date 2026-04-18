// models/Volunteer.model.js

import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    // ─── Core Link to User ──────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one volunteer profile per user
    },

    // ─── Volunteer Status ───────────────────────────────────────────────────
    isAvailable: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: false, // Admin must approve volunteer before they go live
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Skills & Capabilities ──────────────────────────────────────────────
    skills: {
      type: [String],
      enum: [
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
      ],
      default: [],
    },

    // ─── Emergency Types They Handle ────────────────────────────────────────
    emergencyTypes: {
      type: [String],
      enum: [
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
      ],
      default: [],
    },

    // ─── Location & Radius ──────────────────────────────────────────────────
    serviceArea: {
      city: { type: String, trim: true },
      area: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      radiusKm: {
        type: Number,
        default: 10, // how far they're willing to travel
        min: 1,
        max: 100,
      },
    },

    // ─── Blood Donation Specific ────────────────────────────────────────────
    canDonatBlood: {
      type: Boolean,
      default: false,
    },

    lastDonationDate: {
      type: Date,
      default: null,
    },

    // ─── Availability Schedule ──────────────────────────────────────────────
    availabilitySchedule: {
      monday:    { type: Boolean, default: true },
      tuesday:   { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday:  { type: Boolean, default: true },
      friday:    { type: Boolean, default: true },
      saturday:  { type: Boolean, default: false },
      sunday:    { type: Boolean, default: false },
    },

    // ─── Trust / Reputation Score ───────────────────────────────────────────
    // Computed by scoring.service.js — stored here for fast querying
    reputationScore: {
      type: Number,
      default: 50, // starts at neutral 50/100
      min: 0,
      max: 100,
    },

    // ─── Performance Metrics (used by scoring engine) ───────────────────────
    totalAssigned: {
      type: Number,
      default: 0,
    },

    totalAccepted: {
      type: Number,
      default: 0,
    },

    totalCompleted: {
      type: Number,
      default: 0,
    },

    totalCancelled: {
      type: Number,
      default: 0,
    },

    totalNoResponse: {
      type: Number,
      default: 0,
    },

    // ─── Ratings ────────────────────────────────────────────────────────────
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    ratings: [
      {
        givenBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "HelpRequest",
        },
        score: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ─── Bio / Introduction ─────────────────────────────────────────────────
    bio: {
      type: String,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: "",
    },

    // ─── CNIC (Pakistani ID - for verification) ─────────────────────────────
    cnic: {
      type: String,
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, "CNIC format must be XXXXX-XXXXXXX-X"],
      default: null,
    },

    cnicVerified: {
      type: Boolean,
      default: false,
    },

    // ─── Active Request Being Handled ───────────────────────────────────────
    currentRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      default: null,
    },

    // ─── Suspension ─────────────────────────────────────────────────────────
    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Virtual: acceptance rate ────────────────────────────────────────────────
volunteerSchema.virtual("acceptanceRate").get(function () {
  if (this.totalAssigned === 0) return 0;
  return ((this.totalAccepted / this.totalAssigned) * 100).toFixed(1);
});

// ─── Virtual: completion rate ────────────────────────────────────────────────
volunteerSchema.virtual("completionRate").get(function () {
  if (this.totalAccepted === 0) return 0;
  return ((this.totalCompleted / this.totalAccepted) * 100).toFixed(1);
});

// ─── Virtual: cancellation rate ──────────────────────────────────────────────
volunteerSchema.virtual("cancellationRate").get(function () {
  if (this.totalAccepted === 0) return 0;
  return ((this.totalCancelled / this.totalAccepted) * 100).toFixed(1);
});

// ─── Instance Method: Add a new rating + recalculate average ─────────────────
volunteerSchema.methods.addRating = function (userId, requestId, score, comment = "") {
  this.ratings.push({ givenBy: userId, requestId, score, comment });
  this.totalRatings += 1;
  const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
  this.averageRating = parseFloat((total / this.totalRatings).toFixed(2));
};

// ─── Instance Method: Mark as busy (assigned a request) ──────────────────────
volunteerSchema.methods.assignRequest = function (requestId) {
  this.currentRequestId = requestId;
  this.isAvailable = false;
  this.totalAssigned += 1;
};

// ─── Instance Method: Free up after completing/cancelling ────────────────────
volunteerSchema.methods.freeUp = function () {
  this.currentRequestId = null;
  this.isAvailable = true;
};

// ─── Indexes ─────────────────────────────────────────────────────────────────
volunteerSchema.index({ user: 1 });
volunteerSchema.index({ isAvailable: 1, isApproved: 1 });
volunteerSchema.index({ reputationScore: -1 });
volunteerSchema.index({ "serviceArea.city": 1 });
volunteerSchema.index({ emergencyTypes: 1 });
volunteerSchema.index({ skills: 1 });

// ensure virtuals show up in JSON
volunteerSchema.set("toJSON", { virtuals: true });
volunteerSchema.set("toObject", { virtuals: true });

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;