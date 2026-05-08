import mongoose from "mongoose";

const helpRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester ID is required"],
    },

    emergencyType: {
      type: String,
      enum: {
        values: ["medical", "blood", "accident", "disaster", "other"],
        message: "{VALUE} is not a valid emergency type",
      },
      required: [true, "Emergency type is required"],
    },

    urgencyLevel: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "critical"],
        message: "{VALUE} is not a valid urgency level",
      },
      required: [true, "Urgency level is required"],
    },

    urgencyScore: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    proofImage: {
      type: String,
      default: null,
    },

    bloodGroupNeeded: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
        message: "{VALUE} is not a valid blood group",
      },
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (coords) {
            if (!coords || coords.length === 0) return true;
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&
              coords[1] >= -90  && coords[1] <= 90
            );
          },
          message: "Invalid coordinates — must be [longitude, latitude]",
        },
      },
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["posted", "accepted", "in_progress", "completed", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "posted",
    },

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

    postedAt:    { type: Date, default: Date.now },
    acceptedAt:  { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    responseTime:   { type: Number, default: null }, // minutes
    resolutionTime: { type: Number, default: null }, // minutes

    isDisasterMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);
helpRequestSchema.index({ location: "2dsphere" }, { sparse: true });
helpRequestSchema.index({ status: 1, urgencyScore: -1 });
helpRequestSchema.index({ requesterId: 1, status: 1 });
helpRequestSchema.index({ emergencyType: 1, status: 1 });
helpRequestSchema.index({ city: 1, status: 1, urgencyScore: -1 }); // ← primary query path
helpRequestSchema.pre("save", function () {
  if (this.isModified("urgencyLevel")) {
    this.urgencyScore = calculateUrgencyScore(this.urgencyLevel);
  }
  const coords = this.location?.coordinates;
  if (!coords || coords.length !== 2) {
    this.location = undefined;
  }
});
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
helpRequestSchema.virtual("isActive").get(function () {
  return ["posted", "accepted", "in_progress"].includes(this.status);
});

helpRequestSchema.set("toJSON",   { virtuals: true });
helpRequestSchema.set("toObject", { virtuals: true });

const HelpRequest = mongoose.model("HelpRequest", helpRequestSchema);
export default HelpRequest;