// utils/apiResponse.js
// Standardized API response utility for AidConnect
// Every controller uses these functions to send responses

// SUCCESS RESPONSE
const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// ERROR RESPONSE
const sendError = (res, statusCode = 500, message = "Internal Server Error") => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// PAGINATED RESPONSE
const sendPaginated = (res, message = "Success", data = [], pagination = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      pages: pagination.pages || 1,
    },
  });
};

export { sendSuccess, sendError, sendPaginated };