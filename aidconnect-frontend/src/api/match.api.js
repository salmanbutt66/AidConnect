// src/api/match.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// GET /api/matches/my
// Get all notified matches for the logged-in volunteer
// ─────────────────────────────────────────
export const getMyMatches = async () => {
  const response = await axiosInstance.get("/matches/my");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/matches/:id/decline
// Decline a specific match
// ─────────────────────────────────────────
export const declineMatch = async (matchId) => {
  const response = await axiosInstance.put(`/matches/${matchId}/decline`);
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/matches/request/:requestId
// Get all matches for a request (admin / volunteer)
// ─────────────────────────────────────────
export const getRequestMatches = async (requestId) => {
  const response = await axiosInstance.get(`/matches/request/${requestId}`);
  return response.data;
};