import axiosInstance from "./axiosInstance.js";
export const createRequest = async (requestData) => {
  const response = await axiosInstance.post("/requests", requestData);
  return response.data;
};
export const getMyRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests/my", { params });
  return response.data;
};
export const getNearbyRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests/nearby", { params });
  return response.data;
};
export const getRequestById = async (requestId) => {
  const response = await axiosInstance.get(`/requests/${requestId}`);
  return response.data;
};
export const cancelRequest = async (requestId) => {
  const response = await axiosInstance.put(`/requests/${requestId}/cancel`);
  return response.data;
};
export const acceptRequest = async (requestId, matchId) => {
  const response = await axiosInstance.put(`/requests/${requestId}/accept`, {
    matchId,
  });
  return response.data;
};
export const updateRequestStatus = async (requestId, status) => {
  const response = await axiosInstance.put(`/requests/${requestId}/status`, {
    status,
  });
  return response.data;
};
export const rateRequest = async (requestId, ratingData) => {
  const response = await axiosInstance.post(
    `/requests/${requestId}/rate`,
    ratingData
  );
  return response.data;
};
export const getAllRequests = async (params = {}) => {
  const response = await axiosInstance.get("/requests", { params });
  return response.data;
};
export const deleteRequest = async (requestId) => {
  const response = await axiosInstance.delete(`/requests/${requestId}`);
  return response.data;
};