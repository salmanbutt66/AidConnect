import axiosInstance from "./axiosInstance.js";
export const getMyVolunteerProfile = async () => {
  const response = await axiosInstance.get("/volunteers/profile");
  return response.data;
};
export const updateVolunteerProfile = async (profileData) => {
  const response = await axiosInstance.put("/volunteers/profile", profileData);
  return response.data;
};
export const toggleAvailability = async () => {
  const response = await axiosInstance.put("/volunteers/availability");
  return response.data;
};
export const getVolunteerStats = async () => {
  const response = await axiosInstance.get("/volunteers/stats");
  return response.data;
};
export const getMyRatings = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/ratings", { params });
  return response.data;
};
export const getVolunteerHistory = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/history", { params });
  return response.data;
};
export const getActiveRequest = async () => {
  const response = await axiosInstance.get("/volunteers/active-request");
  return response.data;
};
export const acceptRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/accept`
  );
  return response.data;
};
export const markInProgress = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/in-progress`
  );
  return response.data;
};
export const completeRequest = async (requestId) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/complete`
  );
  return response.data;
};
export const cancelRequest = async (requestId, reason) => {
  const response = await axiosInstance.put(
    `/volunteers/request/${requestId}/cancel`,
    { reason }
  );
  return response.data;
};
export const getAvailableVolunteers = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/available", { params });
  return response.data;
};
export const getAllVolunteers = async (params = {}) => {
  const response = await axiosInstance.get("/volunteers/all", { params });
  return response.data;
};
export const approveVolunteer = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/approve`
  );
  return response.data;
};
export const suspendVolunteer = async (volunteerId, reason) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/suspend`,
    { reason }
  );
  return response.data;
};
export const unsuspendVolunteer = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/unsuspend`
  );
  return response.data;
};
export const recalculateScore = async (volunteerId) => {
  const response = await axiosInstance.put(
    `/volunteers/${volunteerId}/recalculate-score`
  );
  return response.data;
};
export const rateVolunteer = async (volunteerId, ratingData) => {
  const response = await axiosInstance.post(
    `/volunteers/${volunteerId}/rate`,
    ratingData
  );
  return response.data;
};
export const getVolunteerById = async (volunteerId) => {
  const response = await axiosInstance.get(`/volunteers/${volunteerId}`);
  return response.data;
};