import axiosInstance from "./axiosInstance.js";
export const getMyNotifications = async (params = {}) => {
  const response = await axiosInstance.get("/notifications", { params });
  return response.data;
};
export const getUnreadCount = async () => {
  const response = await axiosInstance.get("/notifications/unread-count");
  return response.data;
};
export const markAllAsRead = async () => {
  const response = await axiosInstance.put("/notifications/read-all");
  return response.data;
};
export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.put(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};
export const deleteNotification = async (notificationId) => {
  const response = await axiosInstance.delete(
    `/notifications/${notificationId}`
  );
  return response.data;
};
export const clearAllNotifications = async () => {
  const response = await axiosInstance.delete("/notifications");
  return response.data;
};