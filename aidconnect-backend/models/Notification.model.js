import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    type: {
      type: String,
      enum: [
        "new_request",
        "request_accepted",
        "request_completed",
        "request_cancelled",
        "account_verified",
        "disaster_alert",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);