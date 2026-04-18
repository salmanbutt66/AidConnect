// models/HelpRequest.model.js
// The central model of AidConnect
// Every emergency request posted by users is stored here
// This collection will have the most reads and writes in the system

const mongoose = require("mongoose");

// ─────────────────────────────────────────
// HELP REQUEST SCHEMA
// ─────────────────────────────────────────
const helpRequestSchema = new mongoose.Schema(
  {
    // ── WHO POSTED IT ──────────────────────
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",          // references Users collection
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
    // Calculated automatically when request is created
    // critical = 90-100, high = 60-89, medium = 30-59, low = 1-29
    // Used to prioritize requests in the matching engine
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
      type: String,         // URL to uploaded image
      default: null,
    },

    // ── BLOOD GROUP (only for blood requests) ──
    bloodGroupNeeded: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
        message: "{VALUE} is not a valid blood group",
      },
      default: null,
    },

    // ── LOCATION ───────────────────────────
    // GeoJSON format required for MongoDB geo queries
    // coordinates: [longitude, latitude] ← this order always
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],     // [longitude, latitude]
        required: [true, "Location coordinates are required"],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&   // longitude validation
              coords[1] >= -90 &&
              coords[1] <= 90       // latitude validation
            );
          },
          message: "Invalid coordinates. Must be [longitude, latitude]",
        },
      },
    },

    // Human readable address string
    address: {
      type: String,
      trim: true,
      default: null,
    },

    // ── REQUEST STATUS (STATE MACHINE) ─────
    // This is the lifecycle of every request
    // posted → accepted → in_progress → completed
    //                                 → cancelled
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
      refPath: "assignedType",  // dynamic reference based on assignedType
      default: null,
    },

    // Dynamic ref — tells mongoose which collection assignedTo points to
    assignedType: {
      type: String,
      enum: ["Volunteer", "Provider"],
      default: null,
    },

    // ── TIMESTAMPS FOR ANALYTICS ───────────
    // These are used to calculate response time
    // and resolution time in admin analytics
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
    // Calculated and stored when status changes
    // Used in admin analytics aggregation pipelines

    // Minutes from posted to accepted
    responseTime: {
      type: Number,
      default: null,
    },

    // Minutes from posted to completed
    resolutionTime: {
      type: Number,
      default: null,
    },

    // ── DISASTER MODE FLAG ─────────────────
    // Admin can activate disaster mode
    // All requests created during disaster mode
    // get this flag for special filtering
    isDisasterMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    // ── SCHEMA OPTIONS ─────────────────────
    timestamps: true,   // auto adds createdAt and updatedAt
  }
);

// ─────────────────────────────────────────
// INDEXES
// These make database queries fast
// Without indexes, MongoDB scans every document
// ─────────────────────────────────────────

// 2dsphere index for geo queries
// REQUIRED for $nearSphere and $geoWithin queries
// This is what makes "find nearby requests" fast
helpRequestSchema.index({ location: "2dsphere" });

// Compound index for status + urgencyScore
// Used when volunteers fetch nearby open requests
// sorted by urgency
helpRequestSchema.index({ status: 1, urgencyScore: -1 });

// Index for fetching a user's own requests
helpRequestSchema.index({ requesterId: 1, status: 1 });

// Index for emergency type filtering
helpRequestSchema.index({ emergencyType: 1, status: 1 });

// ─────────────────────────────────────────
// PRE-SAVE MIDDLEWARE
// Runs automatically before every .save()
// Calculates urgency score based on urgency level
// ─────────────────────────────────────────
helpRequestSchema.pre("save", function (next) {
  // Only calculate if urgencyLevel was modified
  if (this.isModified("urgencyLevel")) {
    this.urgencyScore = calculateUrgencyScore(this.urgencyLevel);
  }
  next();
});

// ─────────────────────────────────────────
// URGENCY SCORE CALCULATOR
// Converts urgency level to a numeric score
// Random offset adds variety within each range
// critical: 90-100, high: 60-89
// medium:   30-59,  low:  1-29
// ─────────────────────────────────────────
const calculateUrgencyScore = (urgencyLevel) => {
  const ranges = {
    critical: { min: 90, max: 100 },
    high:     { min: 60, max: 89  },
    medium:   { min: 30, max: 59  },
    low:      { min: 1,  max: 29  },
  };

  const range = ranges[urgencyLevel];
  if (!range) return 1;

  // Random score within the range for that urgency level
  return (
    Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  );
};

// ─────────────────────────────────────────
// VIRTUAL FIELD — isActive
// A request is active if it's posted or accepted
// or in progress — not completed or cancelled
// Virtual fields are not stored in DB
// They are calculated on the fly
// ─────────────────────────────────────────
helpRequestSchema.virtual("isActive").get(function () {
  return ["posted", "accepted", "in_progress"].includes(this.status);
});

const HelpRequest = mongoose.model("HelpRequest", helpRequestSchema);

module.exports = HelpRequest;