// services/notification.service.js
import Notification from "../models/Notification.model.js";

// ─────────────────────────────────────────
// CREATE SINGLE NOTIFICATION
// ─────────────────────────────────────────
const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  relatedRequest = null,
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      relatedRequest,
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────
// CREATE BULK NOTIFICATIONS
// Used in disaster mode
// ─────────────────────────────────────────
const createBulkNotifications = async ({
  recipientIds,
  type,
  title,
  message,
}) => {
  try {
    const notifications = recipientIds.map((recipientId) => ({
      recipientId,
      type,
      title,
      message,
      relatedRequest: null,
      isRead: false,
    }));

    const result = await Notification.insertMany(notifications, {
      ordered: false,
    });

    console.log(`✅ Created ${result.length} bulk notifications`);
    return result.length;
  } catch (error) {
    console.error("Failed to create bulk notifications:", error.message);
    return 0;
  }
};

// ─────────────────────────────────────────
// GET USER NOTIFICATIONS
// ─────────────────────────────────────────
const getUserNotifications = async (userId, limit = 20, page = 1) => {
  try {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("relatedRequest", "emergencyType urgencyLevel status"),

      Notification.countDocuments({ recipientId: userId }),

      Notification.countDocuments({
        recipientId: userId,
        isRead: false,
      }),
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to get notifications:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// MARK NOTIFICATION AS READ
// ─────────────────────────────────────────
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    return notification;
  } catch (error) {
    console.error("Failed to mark notification as read:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      { isRead: true }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// NOTIFICATION TEMPLATES
// ─────────────────────────────────────────
const notifyRequestAccepted = async (requesterId, request) => {
  return createNotification({
    recipientId: requesterId,
    type: "request_accepted",
    title: "Help is on the way! 🚑",
    message: `Your ${request.emergencyType} request has been accepted. A responder is heading to your location.`,
    relatedRequest: request._id,
  });
};

const notifyRequestCompleted = async (requesterId, request) => {
  return createNotification({
    recipientId: requesterId,
    type: "request_completed",
    title: "Request Completed ✅",
    message: `Your ${request.emergencyType} request has been marked as completed. Please rate your experience.`,
    relatedRequest: request._id,
  });
};

const notifyRequestCancelled = async (recipientId, request) => {
  return createNotification({
    recipientId,
    type: "request_cancelled",
    title: "Request Cancelled",
    message: `The ${request.emergencyType} request you were assigned to has been cancelled.`,
    relatedRequest: request._id,
  });
};

const notifyAccountVerified = async (userId) => {
  return createNotification({
    recipientId: userId,
    type: "account_verified",
    title: "Account Verified ✅",
    message: `Your account has been verified by an admin. You can now fully access all features of AidConnect.`,
    relatedRequest: null,
  });
};

const notifyDisasterAlert = async (userIds, message) => {
  return createBulkNotifications({
    recipientIds: userIds,
    type: "disaster_alert",
    title: "⚠️ Disaster Alert",
    message,
  });
};

export {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  notifyRequestAccepted,
  notifyRequestCompleted,
  notifyRequestCancelled,
  notifyAccountVerified,
  notifyDisasterAlert,
};