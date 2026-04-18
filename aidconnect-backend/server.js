// server.js
// Entry point for AidConnect backend
//
// ORDER OF OPERATIONS (important):
// 1. Load environment variables first
// 2. Validate them immediately
// 3. Import dependencies
// 4. Create Express app
// 5. Apply middleware
// 6. Mount all routes
// 7. Apply error handler
// 8. Connect to database
// 9. Start listening on port

// ─────────────────────────────────────────
// STEP 1 & 2: ENVIRONMENT SETUP
// Must be first before any other imports
// ─────────────────────────────────────────
require("dotenv").config();
const { validateEnv, env } = require("./config/env");
validateEnv();

// ─────────────────────────────────────────
// STEP 3: IMPORT DEPENDENCIES
// ─────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

// ─────────────────────────────────────────
// IMPORT ALL ROUTES
// Each team member's routes imported here
// Only Haseeb touches this file
// ─────────────────────────────────────────

// Haseeb's routes
const requestRoutes = require("./routes/request.routes");
const matchRoutes = require("./routes/match.routes");

// Salman's routes
const authRoutes = require("./routes/auth.routes");
const volunteerRoutes = require("./routes/volunteer.routes");

// Samrah's routes
const providerRoutes = require("./routes/provider.routes");
const notificationRoutes = require("./routes/notification.routes");

// Rabia's routes
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");

// ─────────────────────────────────────────
// STEP 4: CREATE EXPRESS APP
// ─────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────
// STEP 5: APPLY MIDDLEWARE
// Middleware runs on every request before
// it reaches any route handler
// ─────────────────────────────────────────

// CORS — allows frontend (React on port 5173) to
// talk to backend (Express on port 5000)
// Without this, browser blocks all API requests
app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL  // Vercel URL in production
        : "http://localhost:5173",  // Vite dev server in development
    credentials: true,             // Allow cookies and auth headers
  })
);

// Parse incoming JSON request bodies
// Without this, req.body is undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────
// STEP 6: HEALTH CHECK ROUTE
// Simple route to confirm server is running
// Visit http://localhost:5000/api/health
// ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AidConnect API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────
// STEP 6: MOUNT ALL ROUTES
// All API routes are prefixed with /api
// ─────────────────────────────────────────

// Haseeb's routes
app.use("/api/requests", requestRoutes);
app.use("/api/matches", matchRoutes);

// Salman's routes
app.use("/api/auth", authRoutes);
app.use("/api/volunteers", volunteerRoutes);

// Samrah's routes
app.use("/api/providers", providerRoutes);
app.use("/api/notifications", notificationRoutes);

// Rabia's routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// ─────────────────────────────────────────
// HANDLE UNDEFINED ROUTES
// If someone hits a route that doesn't exist
// return a clean 404 instead of Express default
// ─────────────────────────────────────────
app.use("*splat", (req, res) =>  {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─────────────────────────────────────────
// STEP 7: GLOBAL ERROR HANDLER
// Must be LAST middleware — after all routes
// Catches any error passed via next(error)
// ─────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────
// STEP 8 & 9: CONNECT DB THEN START SERVER
// We only start the server AFTER DB connects
// If DB fails → server never starts
// ─────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Only start listening after DB is connected
    app.listen(env.PORT, () => {
      console.log("─────────────────────────────────────────");
      console.log(`Server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
      console.log("─────────────────────────────────────────");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();