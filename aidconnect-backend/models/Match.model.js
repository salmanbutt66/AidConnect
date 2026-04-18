import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
    },
    matchedTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "matchedType",
    },
    matchedType: {
      type: String,
      enum: ["Volunteer", "Provider"],
      required: true,
    },
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    distanceKm: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["notified", "accepted", "declined", "expired"],
      default: "notified",
    },
    notifiedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

matchSchema.index({ requestId: 1 });
matchSchema.index({ matchedTo: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ requestId: 1, matchedTo: 1 }, { unique: true });

export default mongoose.model("Match", matchSchema);