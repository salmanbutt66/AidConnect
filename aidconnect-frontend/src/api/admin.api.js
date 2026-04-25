// src/api/admin.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────
export const getAllUsers = async (params = {}) => {
  const response = await axiosInstance.get("/admin/users", { params });
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/admin/users/${userId}`);
  return response.data;
};

export const banUser = async (userId, reason) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/ban`, { reason });
  return response.data;
};

export const unbanUser = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/unban`);
  return response.data;
};

export const verifyUser = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/verify`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};

// ─────────────────────────────────────────
// REQUEST MANAGEMENT
// ─────────────────────────────────────────
export const getAllRequests = async (params = {}) => {
  const response = await axiosInstance.get("/admin/requests", { params });
  return response.data;
};

export const cancelRequest = async (requestId) => {
  const response = await axiosInstance.patch(`/admin/requests/${requestId}/cancel`);
  return response.data;
};

// ─────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────
export const getAnalyticsOverview = async () => {
  const response = await axiosInstance.get("/admin/analytics/overview");
  return response.data;
};

export const getEmergencyTypeStats = async () => {
  const response = await axiosInstance.get("/admin/analytics/emergency-types");
  return response.data;
};

export const getMonthlyTrends = async () => {
  const response = await axiosInstance.get("/admin/analytics/monthly-trends");
  return response.data;
};

export const getTopVolunteers = async () => {
  const response = await axiosInstance.get("/admin/analytics/top-volunteers");
  return response.data;
};

// FIX: was missing — Analytics.jsx imports this
export const getTopProviders = async () => {
  const response = await axiosInstance.get("/admin/analytics/top-providers");
  return response.data;
};

export const getHighRiskAreas = async () => {
  const response = await axiosInstance.get("/admin/analytics/high-risk-areas");
  return response.data;
};