// services/notification.service.js
// Handles creation of all in-app notifications for AidConnect
//
// WHEN NOTIFICATIONS ARE CREATED:
//   → New request posted    : nearby volunteers notified
//   → Request accepted      : requester notified
//   → Request completed     : requester notified
//   → Request cancelled     : assigned volunteer notified
//   → Account verified      : user notified
//   → Disaster alert        : all users in area notified
//
// HOW IT WORKS:
//   Every important action calls createNotification()
//   Notification is saved to DB
//   Frontend polls /api/notifications to show them
//   User marks them as read

const Notification = require("../models/Notification.model");

// ─────────────────────────────────────────
// CREATE SINGLE NOTIFICATION
// Core function used everywhere in the app
// Parameters:
//   recipientId    → ObjectId of who receives it
//   type           → notification type (enum)
//   title          → short heading
//   message        → full message text
//   relatedRequest → ObjectId of related request (optional)
// Returns: created Notification document
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
    // Notification failure should never crash the main operation
    // Log it but don't throw — request creation still succeeds
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────
// CREATE BULK NOTIFICATIONS
// Used in disaster mode to notify many users
// Parameters:
//   recipientIds → array of user ObjectIds
//   type         → notification type
//   title        → short heading
//   message      → full message text
// Returns: count of created notifications
// ─────────────────────────────────────────
const createBulkNotifications = async ({
  recipientIds,
  type,
  title,
  message,
}) => {
  try {
    // Build array of notification documents
    const notifications = recipientIds.map((recipientId) => ({
      recipientId,
      type,
      title,
      message,
      relatedRequest: null,
      isRead: false,
    }));

    // insertMany is much faster than creating one by one
    const result = await Notification.insertMany(notifications, {
      ordered: false, // continue even if some fail
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
// Fetches all notifications for a user
// Sorted by most recent first
// Parameters:
//   userId  → ObjectId of the recipient
//   limit   → how many to fetch (default 20)
//   page    → for pagination (default 1)
// Returns: { notifications, unreadCount, total }
// ─────────────────────────────────────────
const getUserNotifications = async (userId, limit = 20, page = 1) => {
  try {
    const skip = (page - 1) * limit;

    // Get notifications and total count in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })          // newest first
        .skip(skip)
        .limit(limit)
        .populate("relatedRequest", "emergencyType urgencyLevel status"),

      Notification.countDocuments({ recipientId: userId }),

      Notification.countDocuments({
        recipientId: userId,
        isRead: false,                    // count unread only
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
// Parameters:
//   notificationId → ObjectId of notification
//   userId         → must match recipientId (security)
// Returns: updated notification
// ─────────────────────────────────────────
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,            // security: user can only mark their own
      },
      { isRead: true },
      { new: true }                     // return updated document
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
// Marks all of a user's notifications as read
// Used when user clicks "Mark all as read"
// Parameters:
//   userId → ObjectId of the recipient
// Returns: count of updated notifications
// ─────────────────────────────────────────
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: userId,
        isRead: false,                  // only update unread ones
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
// PREDEFINED NOTIFICATION TEMPLATES
// Ready-made notifications for common events
// Controllers call these instead of building
// notification objects manually each time
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

module.exports = {
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