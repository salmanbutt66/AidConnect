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
import Provider from "./models/Provider.model.js";
import {
  globalErrorHandler,
  notFound,
  setupProcessHandlers,
} from "./middleware/error.middleware.js";

// ─── Routes ───────────────────────────────────────────────────────────────────
import requestRoutes      from "./routes/request.routes.js";
import matchRoutes        from "./routes/match.routes.js";
import authRoutes         from "./routes/auth.routes.js";
import volunteerRoutes    from "./routes/volunteer.routes.js";
import providerRoutes     from "./routes/provider.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes        from "./routes/admin.routes.js";
import userRoutes         from "./routes/user.routes.js";

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
app.set("etag", false); // Avoid 304 responses for API JSON payloads

// ─── CORS ─────────────────────────────────────────────────────────────────────
const getAllowedOrigins = () => {
  if (env.NODE_ENV !== "production") {
    return ["http://localhost:5173", "http://localhost:3000"];
  }

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    console.warn(
      "⚠️  WARNING: FRONTEND_URL is not set in production env.\n" +
      "   Add FRONTEND_URL=https://your-app.vercel.app to Render env vars.\n" +
      "   Falling back to allow all origins — FIX THIS BEFORE SUBMISSION."
    );
    return "*";
  }

  // Remove trailing slash if present to ensure exact match with origin header
  return [frontendUrl.replace(/\/$/, "")];
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins === "*") return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    console.warn(`CORS blocked request from: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ← THIS LINE FIXES PREFLIGHT REQUESTS
app.use(cors(corsOptions));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure frontend always receives fresh API payloads.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// ─── Root & Health Check ──────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).send("AidConnect API is running. Please use /api for endpoints.");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success:     true,
    message:     "AidConnect API is running",
    environment: env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/requests",      requestRoutes);
app.use("/api/volunteers",    volunteerRoutes);
app.use("/api/providers",     providerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/matches",       matchRoutes);
app.use("/api/admin",         adminRoutes);

// ─── 404 + Global Error ───────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    // ── Migration 1: backfill new rating/availability fields ────────────────
    const migration1Result = await Provider.updateMany(
      { availabilityInitialized: { $ne: true } },
      {
        $set: {
          isAvailable:             true,
          availabilityInitialized: true,
          averageRating:           0,
          totalRatings:            0,
          credibilityScore:        50,
        },
      }
    );

    if (migration1Result.modifiedCount > 0) {
      console.log(`[Migration 1] Backfilled ${migration1Result.modifiedCount} provider(s) with rating fields`);
    }

    // ── Migration 2: backfill city field from address ────────────────────────
    const needsCityBackfill = await Provider.find({
      city:    { $in: [null, ""] },
      address: { $nin: [null, ""] },
    }).select("_id address");

    if (needsCityBackfill.length > 0) {
      const bulkOps = needsCityBackfill.map((p) => ({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { city: p.address.trim() } },
        },
      }));
      const migration2Result = await Provider.bulkWrite(bulkOps);
      console.log(
        `[Migration 2] Copied address→city for ${migration2Result.modifiedCount} provider(s). ` +
        `These providers should verify their city in their profile.`
      );
    }

    const server = app.listen(env.PORT, () => {
      console.log("─────────────────────────────────────────────");
      console.log(`🚀 Server running on port     ${env.PORT}`);
      console.log(`🌍 Environment:               ${env.NODE_ENV}`);
      console.log(`🔗 Health: http://localhost:${env.PORT}/api/health`);
      console.log("─────────────────────────────────────────────");
    });

    setupProcessHandlers(server);
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();