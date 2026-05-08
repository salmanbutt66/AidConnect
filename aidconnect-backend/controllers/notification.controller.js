
import Notification from "../models/Notification.model.js";
import { AppError } from "../middleware/error.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("relatedRequest", "emergencyType urgencyLevel status"),

    Notification.countDocuments({ recipientId: req.user.id }),

    Notification.countDocuments({ recipientId: req.user.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    total,
    unreadCount,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: notifications,
  });
});
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipientId: req.user.id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.isRead) {
    return res.status(200).json({
      success: true,
      message: "Already marked as read",
      data: notification,
    });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipientId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
  });
});
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientId: req.user.id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted",
  });
});
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ recipientId: req.user.id });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} notifications cleared`,
  });
});
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipientId: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});