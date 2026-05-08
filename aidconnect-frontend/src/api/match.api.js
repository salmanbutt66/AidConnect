import axiosInstance from "./axiosInstance.js";
export const getMyMatches = async (params = {}) => {
  const response = await axiosInstance.get("/matches/my", { params });
  return response.data;
};
export const declineMatch = async (matchId) => {
  const response = await axiosInstance.put(`/matches/${matchId}/decline`);
  return response.data;
};
export const getRequestMatches = async (requestId) => {
  const response = await axiosInstance.get(`/matches/request/${requestId}`);
  return response.data;
};