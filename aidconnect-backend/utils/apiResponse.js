// utils/apiResponse.js
export const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const apiResponse = (statusCode, message, data = null) => {
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data,
  };
};