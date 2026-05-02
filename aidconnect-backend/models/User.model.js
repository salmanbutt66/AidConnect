// models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2,  "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "volunteer", "provider", "admin"],
      default: "user",
    },

    phone: {
      type: String,
      trim: true,
      match: [/^(\+92|0)[0-9]{10}$/, "Please provide a valid Pakistani phone number"],
    },

    // ── LOCATION ─────────────────────────────────────────────────────────────
    // City-based matching only. Coordinates are optional and NOT indexed.
    // No 2dsphere index on User — matching is done by city string comparison.
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (coords) {
            if (!coords || coords.length === 0) return true;
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&
              coords[1] >= -90  && coords[1] <= 90
            );
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
      city: { type: String, trim: true, default: null },
      area: { type: String, trim: true, default: null },
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    isActive:    { type: Boolean, default: true  },
    isVerified:  { type: Boolean, default: false },
    isBanned:    { type: Boolean, default: false },
    bannedReason:{ type: String,  default: null  },

    lastLogin:         { type: Date,   default: null },
    totalRequestsMade: { type: Number, default: 0    },

    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ "location.city": 1 }); // city-based matching index

// ─── Pre-save Hook: Hash password ─────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Pre-save Hook: Strip empty coordinates ───────────────────────────────────
userSchema.pre("save", function () {
  if (!this.location) return;
  const coords = this.location.coordinates;
  if (!coords || coords.length !== 2 ||
      (coords[0] === 0 && coords[1] === 0)) {
    const city = this.location.city;
    const area = this.location.area;
    this.location = { city, area };
  }
});

// ─── Instance Method: Compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Strip sensitive fields ──────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

// ─── Static: Find active non-banned users ─────────────────────────────────────
userSchema.statics.findActiveUsers = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isBanned: false });
};

const User = mongoose.model("User", userSchema);
export default User;