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
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "23:59" },
    },
    servicesOffered: {
      type: [String],
      default: [],
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
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
  },
  { timestamps: true }
);
providerSchema.index({ serviceType: 1 });
providerSchema.index({ isVerified: 1 });
providerSchema.index({ isAvailable: 1 });
providerSchema.index({ location: "2dsphere" });
export default mongoose.model("Provider", providerSchema);