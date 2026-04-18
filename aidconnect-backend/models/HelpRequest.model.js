const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyType: {
      type: String,
      enum: ["medical", "blood", "accident", "disaster", "other"],
      required: [true, "Emergency type is required"],
    },
    urgencyLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: [true, "Urgency level is required"],
    },
    urgencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    proofImage: {
      type: String,
      default: "",
    },
    bloodGroupNeeded: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null,
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
    address: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["posted", "accepted", "in_progress", "completed", "cancelled"],
      default: "posted",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: "assignedType",
    },
    assignedType: {
      type: String,
      enum: ["Volunteer", "Provider"],
      default: null,
    },

    // Timestamps for response time calculation
    postedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Calculated time fields for aggregation
    responseTime: {
      type: Number,
      default: null,
    },
    resolutionTime: {
      type: Number,
      default: null,
    },

    isDisasterMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
helpRequestSchema.index({ status: 1 });
helpRequestSchema.index({ emergencyType: 1 });
helpRequestSchema.index({ urgencyScore: -1 });
helpRequestSchema.index({ location: "2dsphere" });
helpRequestSchema.index({ requesterId: 1 });
helpRequestSchema.index({ status: 1, urgencyScore: -1 }); // Compound index

// Auto calculate urgency score before saving
helpRequestSchema.pre("save", function (next) {
  const urgencyMap = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100,
  };

  const typeBoost = {
    medical: 10,
    blood: 10,
    accident: 8,
    disaster: 8,
    other: 0,
  };

  const base = urgencyMap[this.urgencyLevel] || 0;
  const boost = typeBoost[this.emergencyType] || 0;
  this.urgencyScore = Math.min(base + boost, 100);

  next();
});

module.exports = mongoose.model("HelpRequest", helpRequestSchema);