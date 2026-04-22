// src/api/auth.api.js
import axiosInstance from "./axiosInstance.js";

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (userData) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  // Store token in localStorage for interceptor
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  return response.data;
};

// ─────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  localStorage.removeItem("accessToken");
  return response.data;
};

// ─────────────────────────────────────────
// POST /api/auth/refresh-token
// ─────────────────────────────────────────
export const refreshToken = async () => {
  const response = await axiosInstance.post("/auth/refresh-token");
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  return response.data;
};

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/auth/update-profile
// ─────────────────────────────────────────
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put(
    "/auth/update-profile",
    profileData
  );
  return response.data;
};

// ─────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put(
    "/auth/change-password",
    passwordData
  );
  return response.data;
};

// ─────────────────────────────────────────
// DELETE /api/auth/delete-account
// ─────────────────────────────────────────
export const deleteAccount = async () => {
  const response = await axiosInstance.delete("/auth/delete-account");
  localStorage.removeItem("accessToken");
  return response.data;
};