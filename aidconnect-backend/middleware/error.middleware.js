// middleware/error.middleware.js

// ─────────────────────────────────────────────────────────────────────────────
// Custom Error Class — throw this anywhere in controllers
// Usage: throw new AppError("Not found", 404)
// ─────────────────────────────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode  = statusCode;
    this.code        = code;       // optional machine-readable code e.g. "NOT_FOUND"
    this.isOperational = true;     // marks it as a known/expected error
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Mongoose CastError (invalid ObjectId)
// e.g. /api/users/not-a-valid-id
// ─────────────────────────────────────────────────────────────────────────────
const handleCastError = (err) => {
  return new AppError(
    `Invalid ${err.path}: "${err.value}" is not a valid ID`,
    400,
    "INVALID_ID"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Mongoose Duplicate Key (unique constraint violated)
// e.g. registering with an existing email
// ─────────────────────────────────────────────────────────────────────────────
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `"${value}" is already taken for field: ${field}. Please use a different value.`,
    409,
    "DUPLICATE_KEY"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler: Mongoose Validation Error
// e.g. missing required field, enum mismatch, minlength fail
// ─────────────────────────────────────────────────────────────────────────────
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field:   e.path,
    message: e.message,
  }));

  return new AppError(
    `Validation failed: ${errors.map((e) => e.message).join(". ")}`,
    400,
    "VALIDATION_ERROR",
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler: JWT Errors (backup — most are caught in auth.middleware)
// ─────────────────────────────────────────────────────────────────────────────
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401, "TOKEN_INVALID");

const handleJWTExpiredError = () =>
  new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");

// ─────────────────────────────────────────────────────────────────────────────
// Dev Error Response — full stack trace + all details
// ─────────────────────────────────────────────────────────────────────────────
const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    success:    false,
    status:     err.status,
    code:       err.code    || null,
    message:    err.message,
    stack:      err.stack,
    error:      err,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Prod Error Response — only expose operational errors to client
// Programming/unknown errors get a generic message
// ─────────────────────────────────────────────────────────────────────────────
const sendProdError = (err, res) => {
  // Operational error — safe to show to user
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code:    err.code    || null,
      message: err.message,
    });
  }

  // Programming error — log it but don't leak details
  console.error("💥 UNHANDLED ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 404 Handler — catches requests to undefined routes
// Mount BEFORE globalErrorHandler in server.js
// Usage: app.use(notFound)
// ─────────────────────────────────────────────────────────────────────────────
export const notFound = (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Global Error Handler — Express 4-arg error middleware
// Mount LAST in server.js after all routes
// Usage: app.use(globalErrorHandler)
// ─────────────────────────────────────────────────────────────────────────────
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || "error";

  // ── Log every error in development ───────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    console.error(
      `\n[ERROR] ${new Date().toISOString()}\n` +
      `Route : ${req.method} ${req.originalUrl}\n` +
      `Status: ${err.statusCode}\n` +
      `Msg   : ${err.message}\n` +
      `Stack : ${err.stack}\n`
    );
  }

  // ── Transform known Mongoose / JWT errors into AppErrors ─────────────────
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === "CastError")               error = handleCastError(err);
  if (err.code === 11000)                     error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError")         error = handleValidationError(err);
  if (err.name === "JsonWebTokenError")       error = handleJWTError();
  if (err.name === "TokenExpiredError")       error = handleJWTExpiredError();

  // ── Send appropriate response ─────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// asyncHandler — wraps async route handlers to avoid try/catch repetition
// Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
// Forwards any thrown error to globalErrorHandler automatically
// ─────────────────────────────────────────────────────────────────────────────
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// unhandledRejection + uncaughtException handlers
// Call setupProcessHandlers(server) in server.js after app.listen()
// ─────────────────────────────────────────────────────────────────────────────
export const setupProcessHandlers = (server) => {
  // Unhandled promise rejections (e.g. DB query that wasn't awaited)
  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 UNHANDLED REJECTION:", reason);
    console.error("At promise:", promise);

    // Gracefully close server then exit
    server.close(() => {
      console.error("Server closed due to unhandled rejection. Exiting...");
      process.exit(1);
    });
  });

  // Uncaught synchronous exceptions
  process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION:", err.name, err.message);
    console.error(err.stack);

    server.close(() => {
      console.error("Server closed due to uncaught exception. Exiting...");
      process.exit(1);
    });
  });

  // Graceful SIGTERM shutdown (e.g. when deploying / container stop)
  process.on("SIGTERM", () => {
    console.log("👋 SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("Server closed.");
    });
  });
};