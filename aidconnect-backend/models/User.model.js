// models/User.model.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
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
      select: false, // never returned in queries by default
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

    location: {
      city: { type: String, trim: true },
      area: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
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

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    bannedReason: {
      type: String,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // Tracks how many help requests this user has made
    totalRequestsMade: {
      type: Number,
      default: 0,
    },

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
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// ─── Pre-save Hook: Hash password before saving ───────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare entered password with hashed ───────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Get public profile (strip sensitive fields) ─────────────
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

// ─── Index for geospatial + common queries ────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ "location.city": 1 });

const User = mongoose.model("User", userSchema);
export default User;