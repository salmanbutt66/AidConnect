// server.js
import dotenv from "dotenv";
dotenv.config();

import { validateEnv, env } from "./config/env.js";
validateEnv();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import {
  globalErrorHandler,
  notFound,
  setupProcessHandlers,
} from "./middleware/error.middleware.js";

// ─── Haseeb's routes ──────────────────────────────────────────────────────────
import requestRoutes from "./routes/request.routes.js";
import matchRoutes from "./routes/match.routes.js";

// ─── Salman's routes ──────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";

// ─── Samrah's routes ──────────────────────────────────────────────────────────
import providerRoutes from "./routes/provider.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

// ─── Rabia's routes ───────────────────────────────────────────────────────────
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:
    env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "http://localhost:5173",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AidConnect API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/admin", adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log("─────────────────────────────────────────");
      console.log(`🚀 Server running on port     ${env.PORT}`);
      console.log(`🌍 Environment:               ${env.NODE_ENV}`);
      console.log(`🔗 Health: http://localhost:${env.PORT}/api/health`);
      console.log("─────────────────────────────────────────");
    });

    setupProcessHandlers(server);
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();