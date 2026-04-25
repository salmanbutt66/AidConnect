// src/api/provider.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// POST /api/providers/register
// Register as a service provider
// ─────────────────────────────────────────
export const registerProvider = async (providerData) => {
  const response = await axiosInstance.post("/providers/register", providerData);
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/providers/profile
// Get own provider profile
// ─────────────────────────────────────────
export const getProviderProfile = async () => {
  const response = await axiosInstance.get("/providers/profile");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/providers/profile
// Update provider profile
// ─────────────────────────────────────────
export const updateProviderProfile = async (profileData) => {
  const response = await axiosInstance.put("/providers/profile", profileData);
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/providers/availability
// Toggle availability on/off
// ─────────────────────────────────────────
export const toggleAvailability = async (data = {}) => {
  const response = await axiosInstance.put("/providers/availability", data);
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/providers/requests
// Get relevant requests for this provider
// ─────────────────────────────────────────
export const getRelevantRequests = async () => {
  const response = await axiosInstance.get("/providers/requests");
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/providers/requests/active
// Get currently assigned active request
// ─────────────────────────────────────────
export const getActiveRequest = async () => {
  const response = await axiosInstance.get("/providers/requests/active");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/providers/requests/:id/accept
// Accept a help request
// ─────────────────────────────────────────
export const acceptRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/providers/requests/${requestId}/accept`
  );
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/providers
// Get all providers (admin only)
// ─────────────────────────────────────────
export const getAllProviders = async (params = {}) => {
  const response = await axiosInstance.get("/providers", { params });
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/providers/:id/verify
// Verify a provider (admin only)
// ─────────────────────────────────────────
export const verifyProvider = async (providerId) => {
  const response = await axiosInstance.put(`/providers/${providerId}/verify`);
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/providers/:id/suspend
// Suspend a provider (admin only)
// ─────────────────────────────────────────
export const suspendProvider = async (providerId) => {
  const response = await axiosInstance.put(`/providers/${providerId}/suspend`);
  return response.data;
};