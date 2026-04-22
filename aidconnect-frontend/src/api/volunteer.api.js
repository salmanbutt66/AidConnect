// src/api/volunteer.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// GET /api/volunteers/profile
// Get own volunteer profile
// ─────────────────────────────────────────
export const getMyVolunteerProfile = async () => {
  const response = await axiosInstance.get("/volunteers/profile");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/profile
// Update volunteer profile
// ─────────────────────────────────────────
export const updateVolunteerProfile = async (profileData) => {
  const response = await axiosInstance.put("/volunteers/profile", profileData);
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/availability
// Toggle availability on/off
// ─────────────────────────────────────────
export const toggleAvailability = async () => {
  const response = await axiosInstance.put("/volunteers/availability");
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/stats
// Get volunteer performance stats
// ─────────────────────────────────────────
export const getVolunteerStats = async () => {
  const response = await axiosInstance.get("/volunteers/stats");
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/ratings
// Get my ratings
// ─────────────────────────────────────────
export const getMyRatings = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/ratings", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/history
// Get request history
// ─────────────────────────────────────────
export const getVolunteerHistory = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/history", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/active-request
// Get current active request
// ─────────────────────────────────────────
export const getActiveRequest = async () => {
  const response = await axiosInstance.get("/volunteers/active-request");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/request/:requestId/accept
// Accept a request
// ─────────────────────────────────────────
export const acceptRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/accept`
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/request/:requestId/in-progress
// Mark request as in progress
// ─────────────────────────────────────────
export const markInProgress = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/in-progress`
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/request/:requestId/complete
// Mark request as completed
// ─────────────────────────────────────────
export const completeRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/complete`
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/request/:requestId/cancel
// Cancel an accepted request
// ─────────────────────────────────────────
export const cancelRequest = async (requestId, reason) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/cancel`,
    { reason }
  );
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/available
// Get available volunteers (admin)
// ─────────────────────────────────────────
export const getAvailableVolunteers = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/available", { params });
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/all
// Get all volunteers (admin)
// ─────────────────────────────────────────
export const getAllVolunteers = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/all", { params });
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/:id/approve
// Approve a volunteer (admin)
// ─────────────────────────────────────────
export const approveVolunteer = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/approve`
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/:id/suspend
// Suspend a volunteer (admin)
// ─────────────────────────────────────────
export const suspendVolunteer = async (volunteerId, reason) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/suspend`,
    { reason }
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/:id/unsuspend
// Lift suspension (admin)
// ─────────────────────────────────────────
export const unsuspendVolunteer = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/unsuspend`
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/volunteers/:id/recalculate-score
// Recalculate reputation score (admin)
// ─────────────────────────────────────────
export const recalculateScore = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/recalculate-score`
  );
  return response.data;
};

// ─────────────────────────────────────────
// POST /api/volunteers/:id/rate
// Rate a volunteer (user)
// ─────────────────────────────────────────
export const rateVolunteer = async (volunteerId, ratingData) => {
  const response = await axiosInstance.post(
    `/volunteers/${volunteerId}/rate`,
    ratingData
  );
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/volunteers/:id
// Get volunteer public profile
// ─────────────────────────────────────────
export const getVolunteerById = async (volunteerId) => {
  const response = await axiosInstance.get(`/volunteers/${volunteerId}`);
  return response.data;
};