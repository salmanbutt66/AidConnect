// src/api/request.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// POST /api/requests
// Create a new help request
// ─────────────────────────────────────────
export const createRequest = async (requestData) => {
  const response = await axiosInstance.post("/requests", requestData);
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/requests/my
// Get own requests (user)
// ─────────────────────────────────────────
export const getMyRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests/my", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/requests/nearby
// Get nearby open requests (volunteer)
// ─────────────────────────────────────────
export const getNearbyRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests/nearby", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/requests/:id
// Get single request detail
// ─────────────────────────────────────────
export const getRequestById = async (requestId) => {
  const response = await axiosInstance.get(`/requests/${requestId}`);
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/requests/:id/cancel
// Cancel own request (user)
// ─────────────────────────────────────────
export const cancelRequest = async (requestId) => {
  const response = await axiosInstance.put(`/requests/${requestId}/cancel`);
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/requests/:id/accept
// Accept a request (volunteer)
// ─────────────────────────────────────────
export const acceptRequest = async (requestId, matchId) => {
  const response = await axiosInstance.put(`/requests/${requestId}/accept`, {
    matchId,
  });
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/requests/:id/status
// Update request status (volunteer/provider)
// ─────────────────────────────────────────
export const updateRequestStatus = async (requestId, status) => {
  const response = await axiosInstance.put(`/requests/${requestId}/status`, {
    status,
  });
  return response.data;
};

// ─────────────────────────────────────────
// POST /api/requests/:id/rate
// Rate a completed request (user)
// ─────────────────────────────────────────
export const rateRequest = async (requestId, ratingData) => {
  const response = await axiosInstance.post(
    `/requests/${requestId}/rate`,
    ratingData
  );
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/requests
// Get all requests (admin)
// ─────────────────────────────────────────
export const getAllRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests", { params });
  return response.data;
};

// ─────────────────────────────────────────
// DELETE /api/requests/:id
// Delete a request (admin)
// ─────────────────────────────────────────
export const deleteRequest = async (requestId) => {
  const response = await axiosInstance.delete(`/requests/${requestId}`);
  return response.data;
};