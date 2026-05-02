// models/Provider.model.js
import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },

    serviceType: {
      type: String,
      enum: ["ambulance", "hospital", "blood_bank", "rescue", "ngo", "other"],
      required: [true, "Service type is required"],
    },

    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    availabilityInitialized: {
      type: Boolean,
      default: true,
    },

    // ── RATINGS & CREDIBILITY ──────────────────────────────────────────────
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

    // 0-100 score derived from averageRating. Used in admin analytics.
    // Formula: round((averageRating / 5) * 100), clamped 0-100.
    credibilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    // ── OPERATING HOURS ────────────────────────────────────────────────────
    operatingHours: {
      open:  { type: String, default: "00:00" },
      close: { type: String, default: "23:59" },
    },

    servicesOffered: {
      type: [String],
      default: [],
    },

    contactNumber: {
      type: String,
      trim: true,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: null,           // FIX: was "" — empty string is truthy-falsy ambiguous
    },

    // ── CITY (PRIMARY MATCHING FIELD) ──────────────────────────────────────
    // This is the flat field used by getRelevantRequests to city-filter
    // incoming HelpRequests. It mirrors the same flat `city` field on
    // HelpRequest so the query is a direct string comparison.
    //
    // Previously city was nested inside location.city but the GeoJSON
    // sub-schema only had `type` and `coordinates` — location.city was
    // never stored and always read back as undefined, causing every
    // provider to fall through to a nationwide (no city filter) query.
    city: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // ── LOCATION (GPS — optional, for future map features) ─────────────────
    // Stored only when the provider supplies valid coordinates.
    // NOT used for request matching — city field above handles that.
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
providerSchema.index({ serviceType: 1 });
providerSchema.index({ isVerified: 1 });
providerSchema.index({ isAvailable: 1 });
providerSchema.index({ city: 1, serviceType: 1 });           // primary query path
providerSchema.index({ location: "2dsphere" }, { sparse: true }); // GPS optional

export default mongoose.model("Provider", providerSchema);