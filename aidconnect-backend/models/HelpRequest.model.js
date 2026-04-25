// models/HelpRequest.model.js
import mongoose from "mongoose";

const helpRequestSchema = new mongoose.Schema(
  {
    // ── WHO POSTED IT ──────────────────────
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester ID is required"],
    },

    // ── WHAT KIND OF EMERGENCY ─────────────
    emergencyType: {
      type: String,
      enum: {
        values: ["medical", "blood", "accident", "disaster", "other"],
        message: "{VALUE} is not a valid emergency type",
      },
      required: [true, "Emergency type is required"],
    },

    // ── HOW URGENT IS IT ───────────────────
    urgencyLevel: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "critical"],
        message: "{VALUE} is not a valid urgency level",
      },
      required: [true, "Urgency level is required"],
    },

    // ── CALCULATED URGENCY SCORE ───────────
    urgencyScore: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },

    // ── DESCRIPTION ────────────────────────
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // ── OPTIONAL PROOF IMAGE ───────────────
    proofImage: {
      type: String,
      default: null,
    },

    // ── BLOOD GROUP ────────────────────────
    bloodGroupNeeded: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
        message: "{VALUE} is not a valid blood group",
      },
      default: null,
    },

    // ── LOCATION ───────────────────────────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid coordinates. Must be [longitude, latitude]",
        },
      },
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    // ── REQUEST STATUS ─────────────────────
    status: {
      type: String,
      enum: {
        values: ["posted", "accepted", "in_progress", "completed", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "posted",
    },

    // ── WHO IS HANDLING IT ─────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedType",
      default: null,
    },

    assignedType: {
      type: String,
      enum: ["Volunteer", "Provider"],
      default: null,
    },

    // ── TIMESTAMPS FOR ANALYTICS ───────────
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

    // ── PERFORMANCE METRICS ────────────────
    responseTime: {
      type: Number,
      default: null,
    },

    resolutionTime: {
      type: Number,
      default: null,
    },

    // ── DISASTER MODE FLAG ─────────────────
    isDisasterMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
helpRequestSchema.index({ location: "2dsphere" });
helpRequestSchema.index({ status: 1, urgencyScore: -1 });
helpRequestSchema.index({ requesterId: 1, status: 1 });
helpRequestSchema.index({ emergencyType: 1, status: 1 });

// ─── Urgency Score Calculator ─────────────────────────────────────────────────
const calculateUrgencyScore = (urgencyLevel) => {
  const ranges = {
    critical: { min: 90, max: 100 },
    high:     { min: 60, max: 89  },
    medium:   { min: 30, max: 59  },
    low:      { min: 1,  max: 29  },
  };

  const range = ranges[urgencyLevel];
  if (!range) return 1;

  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
};

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
helpRequestSchema.pre("save", function () {
  if (this.isModified("urgencyLevel")) {
    this.urgencyScore = calculateUrgencyScore(this.urgencyLevel);
  }
});

// ─── Virtual: isActive ────────────────────────────────────────────────────────
helpRequestSchema.virtual("isActive").get(function () {
  return ["posted", "accepted", "in_progress"].includes(this.status);
});

helpRequestSchema.set("toJSON", { virtuals: true });
helpRequestSchema.set("toObject", { virtuals: true });

const HelpRequest = mongoose.model("HelpRequest", helpRequestSchema);
export default HelpRequest;