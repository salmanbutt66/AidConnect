// src/api/admin.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────

// GET /api/admin/users
export const getAllUsers = async (params = {}) => {
  const response = await axiosInstance.get("/admin/users", { params });
  return response.data;
};

// GET /api/admin/users/:id
export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/admin/users/${userId}`);
  return response.data;
};

// PATCH /api/admin/users/:id/ban
export const banUser = async (userId, reason) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/ban`, {
    reason,
  });
  return response.data;
};

// PATCH /api/admin/users/:id/unban
export const unbanUser = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/unban`);
  return response.data;
};

// PATCH /api/admin/users/:id/verify
export const verifyUser = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/verify`);
  return response.data;
};

// DELETE /api/admin/users/:id
export const deleteUser = async (userId) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};

// ─────────────────────────────────────────
// REQUEST MANAGEMENT
// ─────────────────────────────────────────

// GET /api/admin/requests
export const getAllRequests = async (params = {}) => {
  const response = await axiosInstance.get("/admin/requests", { params });
  return response.data;
};

// PATCH /api/admin/requests/:id/cancel
export const cancelRequest = async (requestId) => {
  const response = await axiosInstance.patch(
    `/admin/requests/${requestId}/cancel`
  );
  return response.data;
};

// ─────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────

// GET /api/admin/analytics/overview
export const getAnalyticsOverview = async () => {
  const response = await axiosInstance.get("/admin/analytics/overview");
  return response.data;
};

// GET /api/admin/analytics/emergency-types
export const getEmergencyTypeStats = async () => {
  const response = await axiosInstance.get("/admin/analytics/emergency-types");
  return response.data;
};

// GET /api/admin/analytics/monthly-trends
export const getMonthlyTrends = async () => {
  const response = await axiosInstance.get("/admin/analytics/monthly-trends");
  return response.data;
};

// GET /api/admin/analytics/top-volunteers
export const getTopVolunteers = async () => {
  const response = await axiosInstance.get("/admin/analytics/top-volunteers");
  return response.data;
};

// GET /api/admin/analytics/high-risk-areas
export const getHighRiskAreas = async () => {
  const response = await axiosInstance.get("/admin/analytics/high-risk-areas");
  return response.data;
};