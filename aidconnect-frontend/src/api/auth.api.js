import axiosInstance from "./axiosInstance.js";
export const register = async (userData) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};
export const login = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  localStorage.removeItem("accessToken");
  return response.data;
};
export const refreshToken = async () => {
  const response = await axiosInstance.post("/auth/refresh-token");
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  return response.data;
};
export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put(
    "/auth/update-profile",
    profileData
  );
  return response.data;
};
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put(
    "/auth/change-password",
    passwordData
  );
  return response.data;
};
export const deleteAccount = async () => {
  const response = await axiosInstance.delete("/auth/delete-account");
  localStorage.removeItem("accessToken");
  return response.data;
};