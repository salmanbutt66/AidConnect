import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();
// All notification routes are private — any logged in role can access
router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);
router.delete("/", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);
export default router;