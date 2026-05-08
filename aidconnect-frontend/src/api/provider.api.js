import axiosInstance from "./axiosInstance.js";
export const registerProvider = async (providerData) => {
  const response = await axiosInstance.post("/providers/register", providerData);
  return response.data;
};
export const getProviderProfile = async () => {
  const response = await axiosInstance.get("/providers/profile");
  return response.data;
};
export const updateProviderProfile = async (profileData) => {
  const response = await axiosInstance.put("/providers/profile", profileData);
  return response.data;
};
export const toggleAvailability = async (data = {}) => {
  const response = await axiosInstance.put("/providers/availability", data);
  return response.data;
};
export const getRelevantRequests = async () => {
  const response = await axiosInstance.get("/providers/requests");
  return response.data;
};
export const getActiveRequest = async () => {
  const response = await axiosInstance.get("/providers/requests/active");
  return response.data;
};
export const acceptRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/providers/requests/${requestId}/accept`
  );
  return response.data;
};
export const getAllProviders = async (params = {}) => {
  const response = await axiosInstance.get("/providers", { params });
  return response.data;
};
export const verifyProvider = async (providerId) => {
  const response = await axiosInstance.put(`/providers/${providerId}/verify`);
  return response.data;
};
export const suspendProvider = async (providerId) => {
  const response = await axiosInstance.put(`/providers/${providerId}/suspend`);
  return response.data;
};