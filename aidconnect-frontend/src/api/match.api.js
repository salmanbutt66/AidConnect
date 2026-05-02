// src/api/match.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// GET /api/matches/my
// FIX: accept params so callers can pass { status: 'notified' }
// ─────────────────────────────────────────
export const getMyMatches = async (params = {}) => {
  const response = await axiosInstance.get("/matches/my", { params });
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/matches/:id/decline
// ─────────────────────────────────────────
export const declineMatch = async (matchId) => {
  const response = await axiosInstance.put(`/matches/${matchId}/decline`);
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/matches/request/:requestId
// ─────────────────────────────────────────
export const getRequestMatches = async (requestId) => {
  const response = await axiosInstance.get(`/matches/request/${requestId}`);
  return response.data;
};