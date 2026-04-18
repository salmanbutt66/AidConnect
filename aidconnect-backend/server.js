import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { globalErrorHandler, notFound, setupProcessHandlers } from "./middleware/error.middleware.js";
import providerRoutes from "./routes/provider.routes.js";  
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AidConnect API is running",
  });
});

// routes
app.use("/api/providers", providerRoutes); 
app.use("/api/notifications", notificationRoutes);  

// 404 handler — catches undefined routes
app.use(notFound);

// Global error handler — must be last
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

setupProcessHandlers(server);