import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: null,
    },
    skills: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    serviceRadius: { type: Number, default: 10 },
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
    totalRequests: { type: Number, default: 0 },
    completedRequests: { type: Number, default: 0 },
    cancelledRequests: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reliabilityScore: { type: Number, default: 100, min: 0, max: 100 },
    currentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      default: null,
    },
  },
  { timestamps: true }
);

volunteerSchema.index({ bloodGroup: 1 });
volunteerSchema.index({ isAvailable: 1 });
volunteerSchema.index({ location: "2dsphere" });

export default mongoose.model("Volunteer", volunteerSchema);