// utils/asyncHandler.js
// Async error handling wrapper for AidConnect
// 
// THE PROBLEM IT SOLVES:
// Without asyncHandler, every controller would look like this:
//
//   const createRequest = async (req, res, next) => {
//     try {
//       ... controller logic ...
//     } catch (error) {
//       next(error)  ← you'd write this in every single function
//     }
//   }
//
// WITH asyncHandler, every controller looks like this:
//
//   const createRequest = asyncHandler(async (req, res, next) => {
//     ... controller logic only, no try/catch needed ...
//   })
//
// Any error thrown automatically goes to error.middleware.js

// ─────────────────────────────────────────
// HOW IT WORKS:
// asyncHandler takes your async function (fn) as input
// It returns a NEW function that wraps your fn in a Promise
// If your fn throws any error, .catch(next) sends it to
// error.middleware.js automatically
// ─────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;