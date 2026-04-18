// utils/apiResponse.js
// Standardized API response utility for AidConnect
// Every controller uses these functions to send responses
// This ensures consistent response format across all 49 endpoints

// ─────────────────────────────────────────
// SUCCESS RESPONSE
// Used when everything works correctly
// Parameters:
//   res        → Express response object
//   statusCode → HTTP status code (200, 201, etc.)
//   message    → Human readable success message
//   data       → The actual data to send back (optional)
// ─────────────────────────────────────────
const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = {
    success: true,
    message,
  };

  // Only include data field if data was actually provided
  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// ─────────────────────────────────────────
// ERROR RESPONSE
// Used when something goes wrong
// Parameters:
//   res        → Express response object
//   statusCode → HTTP status code (400, 401, 403, 404, 500)
//   message    → Human readable error message
// ─────────────────────────────────────────
const sendError = (res, statusCode = 500, message = "Internal Server Error") => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// ─────────────────────────────────────────
// PAGINATED RESPONSE
// Used when returning lists with pagination
// Admin panel uses this for all list endpoints
// Parameters:
//   res        → Express response object
//   message    → Human readable message
//   data       → Array of items
//   pagination → Object with page, limit, total, pages
// ─────────────────────────────────────────
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

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};