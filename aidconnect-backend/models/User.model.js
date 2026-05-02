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
    // FIX (CRITICAL): The previous schema defaulted coordinates to [0, 0],
    // which meant every single user document was saved with a GeoJSON point
    // in the middle of the ocean. The 2dsphere index indexed all of them,
    // which caused index bloat and — more importantly — caused issues when
    // other collections (HelpRequest, Volunteer) with the same default were
    // also indexed. The fix: remove all defaults from the geo sub-fields so
    // the location field is only stored when real data is provided.
    // The sparse:true index below skips documents with no location entirely.
    //
    // city and area are the only fields guaranteed to be present — they are
    // set at registration time and used by HelpRequestForm as defaultCity.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        // no default — only set when coordinates are provided
      },
      coordinates: {
        type: [Number],
        // no default — omitting this keeps the document out of the geo index
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
// FIX: sparse:true so users without coordinates (i.e. most users)
// are not indexed by the 2dsphere index — prevents the [0,0] poisoning
userSchema.index({ location: "2dsphere" }, { sparse: true });

// ─── Pre-save Hook: Hash password ─────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Pre-save Hook: Strip empty coordinates ───────────────────────────────────
// FIX: if location has no meaningful coordinates, remove the geo sub-fields
// entirely so the 2dsphere index is not triggered. city and area are kept.
userSchema.pre("save", function () {
  if (!this.location) return;
  const coords = this.location.coordinates;
  if (!coords || coords.length !== 2 ||
      (coords[0] === 0 && coords[1] === 0)) {
    // Keep city/area, strip the GeoJSON fields
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