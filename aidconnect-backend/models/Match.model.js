import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: [true, "Request ID is required"],
    },
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
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    distanceKm: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["notified", "accepted", "declined", "expired"],
        message: "{VALUE} is not a valid match status",
      },
      default: "notified",
    },
    notifiedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
    responseTimeMinutes: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);
matchSchema.index({ requestId: 1, status: 1 });
matchSchema.index({ matchedTo: 1, status: 1 });
matchSchema.index({ matchedTo: 1, matchedType: 1, status: 1 });
matchSchema.pre("save", function () {
  if (
    this.isModified("respondedAt") &&
    this.respondedAt &&
    this.notifiedAt
  ) {
    const diffMs = this.respondedAt - this.notifiedAt;
    this.responseTimeMinutes = Math.round(diffMs / 1000 / 60);
  }
});
matchSchema.statics.getRequestMatches = async function (requestId) {
  return await this.find({ requestId })
    .populate("matchedTo")
    .populate("requestId")
    .sort({ matchScore: -1 });
};

matchSchema.statics.getVolunteerMatches = async function (volunteerId) {
  return await this.find({
    matchedTo: volunteerId,
    status:    "notified",
  })
    .populate("requestId")
    .sort({ notifiedAt: -1 });
};

const Match = mongoose.model("Match", matchSchema);
export default Match;