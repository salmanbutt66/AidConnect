// models/Volunteer.model.js

import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
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

    skills: {
      type: [String],
      enum: [
        "first_aid", "firefighting", "rescue", "medical",
        "counseling", "logistics", "driving", "blood_donation",
        "food_distribution", "shelter_setup", "translation",
        "it_support", "other",
      ],
      default: [],
    },

    emergencyTypes: {
      type: [String],
      enum: [
        "medical", "fire", "flood", "earthquake", "accident",
        "blood_request", "food_shortage", "mental_health",
        "missing_person", "other",
      ],
      default: [],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    serviceArea: {
      city: { type: String, trim: true },
      area: { type: String, trim: true },
      radiusKm: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },
    },

    canDonatBlood: {
      type: Boolean,
      default: false,
    },

    lastDonationDate: {
      type: Date,
      default: null,
    },

    availabilitySchedule: {
      monday:    { type: Boolean, default: true },
      tuesday:   { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday:  { type: Boolean, default: true },
      friday:    { type: Boolean, default: true },
      saturday:  { type: Boolean, default: false },
      sunday:    { type: Boolean, default: false },
    },

    reputationScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    totalAssigned:   { type: Number, default: 0 },
    totalAccepted:   { type: Number, default: 0 },
    totalCompleted:  { type: Number, default: 0 },
    totalCancelled:  { type: Number, default: 0 },
    totalNoResponse: { type: Number, default: 0 },

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

    bio: {
      type: String,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: "",
    },

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

    currentRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
volunteerSchema.virtual("acceptanceRate").get(function () {
  if (this.totalAssigned === 0) return 0;
  return ((this.totalAccepted / this.totalAssigned) * 100).toFixed(1);
});

volunteerSchema.virtual("completionRate").get(function () {
  if (this.totalAccepted === 0) return 0;
  return ((this.totalCompleted / this.totalAccepted) * 100).toFixed(1);
});

volunteerSchema.virtual("cancellationRate").get(function () {
  if (this.totalAccepted === 0) return 0;
  return ((this.totalCancelled / this.totalAccepted) * 100).toFixed(1);
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
volunteerSchema.methods.addRating = function (userId, requestId, score, comment = "") {
  this.ratings.push({ givenBy: userId, requestId, score, comment });
  this.totalRatings += 1;
  const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
  this.averageRating = parseFloat((total / this.totalRatings).toFixed(2));
};

volunteerSchema.methods.assignRequest = function (requestId) {
  this.currentRequestId = requestId;
  this.isAvailable = false;
  this.totalAssigned += 1;
};

volunteerSchema.methods.freeUp = function () {
  this.currentRequestId = null;
  this.isAvailable = true;
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
// user index removed — already created by unique: true in schema definition
volunteerSchema.index({ isAvailable: 1, isApproved: 1 });
volunteerSchema.index({ reputationScore: -1 });
volunteerSchema.index({ location: "2dsphere" });
volunteerSchema.index({ emergencyTypes: 1 });
volunteerSchema.index({ skills: 1 });

volunteerSchema.set("toJSON", { virtuals: true });
volunteerSchema.set("toObject", { virtuals: true });

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export default Volunteer;