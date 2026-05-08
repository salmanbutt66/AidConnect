export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
const handleCastError = (err) => {
  return new AppError(
    `Invalid ${err.path}: "${err.value}" is not a valid ID`,
    400,
    "INVALID_ID"
  );
};
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `"${value}" is already taken for field: ${field}. Please use a different value.`,
    409,
    "DUPLICATE_KEY"
  );
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError(
    `Validation failed: ${errors.map((e) => e.message).join(". ")}`,
    400,
    "VALIDATION_ERROR"
  );
};
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401, "TOKEN_INVALID");

const handleJWTExpiredError = () =>
  new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");
const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    status: err.status,
    code: err.code || null,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code || null,
      message: err.message,
    });
  }

  console.error("💥 UNHANDLED ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};
export const notFound = (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
};
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.error(
      `\n[ERROR] ${new Date().toISOString()}\n` +
      `Route : ${req.method} ${req.originalUrl}\n` +
      `Status: ${err.statusCode}\n` +
      `Msg   : ${err.message}\n` +
      `Stack : ${err.stack}\n`
    );
  }

  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === "CastError")         error = handleCastError(err);
  if (err.code === 11000)               error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError")   error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (process.env.NODE_ENV === "development") {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};
export const setupProcessHandlers = (server) => {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 UNHANDLED REJECTION:", reason);
    console.error("At promise:", promise);
    server.close(() => {
      console.error("Server closed due to unhandled rejection. Exiting...");
      process.exit(1);
    });
  });

  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err.name, err.message);
    console.error(err.stack);
    server.close(() => {
      console.error("Server closed due to uncaught exception. Exiting...");
      process.exit(1);
    });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("Server closed.");
    });
  });
};