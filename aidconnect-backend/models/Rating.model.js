import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Rater is required"],
    },
    ratedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    recipientType: {
      type: String,
      enum: ["Volunteer", "Provider"],
      required: [true, "Recipient type is required"],
      default: "Volunteer",
    },
    helpRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: [true, "Help request reference is required"],
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [1, "Score must be at least 1"],
      max: [5, "Score cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [300, "Comment cannot exceed 300 characters"],
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
ratingSchema.index(
  { ratedBy: 1, helpRequest: 1 },
  { unique: true }
);
ratingSchema.index({ ratedTo: 1 });
ratingSchema.index({ recipientType: 1, ratedTo: 1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.statics.getAverageScore = async function (recipientId, recipientType = "Volunteer") {
  const recipientFilter = recipientType === "Volunteer"
    ? { $or: [{ recipientType: "Volunteer" }, { recipientType: { $exists: false } }] }
    : { recipientType };

  const result = await this.aggregate([
    {
      $match: {
        ratedTo: new mongoose.Types.ObjectId(recipientId),
        ...recipientFilter,
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
ratingSchema.statics.getTopRecipients = async function (recipientType = "Volunteer", limit = 5) {
  const recipientFilter = recipientType === "Volunteer"
    ? { $or: [{ recipientType: "Volunteer" }, { recipientType: { $exists: false } }] }
    : { recipientType };

  return await this.aggregate([
    { $match: { isDeleted: false, ...recipientFilter } },
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
        as: "recipientInfo",
      },
    },
    { $unwind: "$recipientInfo" },
    {
      $project: {
        averageScore: 1,
        totalRatings: 1,
        "recipientInfo.name": 1,
        "recipientInfo.email": 1,
        "recipientInfo.location": 1,
      },
    },
  ]);
};

ratingSchema.statics.getTopVolunteers = async function (limit = 5) {
  return this.getTopRecipients("Volunteer", limit);
};

ratingSchema.statics.getTopProviders = async function (limit = 5) {
  return this.getTopRecipients("Provider", limit);
};

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;