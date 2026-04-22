// src/api/notification.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// GET /api/notifications
// Get all notifications for logged in user
// ─────────────────────────────────────────
export const getMyNotifications = async (params = {}) => {
  const response = await axiosInstance.get("/notifications", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/notifications/unread-count
// Lightweight endpoint for badge number
// ─────────────────────────────────────────
export const getUnreadCount = async () => {
  const response = await axiosInstance.get("/notifications/unread-count");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/notifications/read-all
// Mark all notifications as read
// ─────────────────────────────────────────
export const markAllAsRead = async () => {
  const response = await axiosInstance.put("/notifications/read-all");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/notifications/:id/read
// Mark single notification as read
// ─────────────────────────────────────────
export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.put(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

// ─────────────────────────────────────────
// DELETE /api/notifications/:id
// Delete a single notification
// ─────────────────────────────────────────
export const deleteNotification = async (notificationId) => {
  const response = await axiosInstance.delete(
    `/notifications/${notificationId}`
  );
  return response.data;
};

// ─────────────────────────────────────────
// DELETE /api/notifications
// Clear all notifications
// ─────────────────────────────────────────
export const clearAllNotifications = async () => {
  const response = await axiosInstance.delete("/notifications");
  return response.data;
};