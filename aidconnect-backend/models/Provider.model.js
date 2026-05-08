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
    credibilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
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
    city: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
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
providerSchema.index({ serviceType: 1 });
providerSchema.index({ isVerified: 1 });
providerSchema.index({ isAvailable: 1 });
providerSchema.index({ city: 1, serviceType: 1 });           // primary query path
providerSchema.index({ location: "2dsphere" }, { sparse: true }); // GPS optional

export default mongoose.model("Provider", providerSchema);