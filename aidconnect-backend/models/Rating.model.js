// models/Rating.model.js
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // Who gave the rating (must be a user)
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Rater is required"],
    },

    // Who received the rating (must be a volunteer)
    ratedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },

    // Which help request this rating is about
    helpRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: [true, "Help request reference is required"],
    },

    // Star rating 1 to 5
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [1, "Score must be at least 1"],
      max: [5, "Score cannot exceed 5"],
    },

    // Optional written feedback
    comment: {
      type: String,
      trim: true,
      maxlength: [300, "Comment cannot exceed 300 characters"],
      default: null,
    },

    // To prevent duplicate ratings on same request
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Prevent a user from rating the same request twice ───────────────────────
ratingSchema.index(
  { ratedBy: 1, helpRequest: 1 },
  { unique: true }
);

// ─── For fast lookup of all ratings given to a volunteer ─────────────────────
ratingSchema.index({ ratedTo: 1 });

// ─── For analytics: ratings over time ────────────────────────────────────────
ratingSchema.index({ createdAt: -1 });

// ─── Static: Get average score for a volunteer ───────────────────────────────
ratingSchema.statics.getAverageScore = async function (volunteerId) {
  const result = await this.aggregate([
    {
      $match: {
        ratedTo: new mongoose.Types.ObjectId(volunteerId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$ratedTo",
        averageScore: { $avg: "$score" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { averageScore: 0, totalRatings: 0 };
};

// ─── Static: Get top rated volunteers (for admin analytics) ──────────────────
ratingSchema.statics.getTopVolunteers = async function (limit = 5) {
  return await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$ratedTo",
        averageScore: { $avg: "$score" },
        totalRatings: { $sum: 1 },
      },
    },
    { $sort: { averageScore: -1, totalRatings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "volunteerInfo",
      },
    },
    { $unwind: "$volunteerInfo" },
    {
      $project: {
        averageScore: 1,
        totalRatings: 1,
        "volunteerInfo.name": 1,
        "volunteerInfo.email": 1,
        "volunteerInfo.location": 1,
      },
    },
  ]);
};

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;