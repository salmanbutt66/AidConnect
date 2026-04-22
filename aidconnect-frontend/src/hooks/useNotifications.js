// src/hooks/useNotifications.js
import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext.jsx';

/**
 * useNotifications — primary hook for all notification needs.
 *
 * This is a clean wrapper around NotificationContext, which already owns:
 *   - The full notifications array (polled every 30s automatically)
 *   - The unread badge count
 *   - All async actions (mark read, delete, clear)
 *
 * The hook adds nothing on top of the context — it just provides a safe,
 * ergonomic import so components never touch NotificationContext directly.
 *
 * ─── STATE (all managed by NotificationContext) ───────────────────────────
 *   notifications    → array of notification objects (latest 20, auto-polled)
 *                      shape: { _id, type, title, message, isRead,
 *                               relatedRequest, createdAt }
 *   unreadCount      → integer — drives the navbar badge
 *   loading          → true while fetchNotifications is running
 *
 * ─── ACTIONS ──────────────────────────────────────────────────────────────
 *   fetchNotifications(params?)
 *     → GET /api/notifications  (params: { limit })
 *       Manually refresh the full list. Context already calls this on mount
 *       and polls fetchCount every 30s, but call this explicitly after an
 *       action that might produce a new notification (e.g. request accepted).
 *
 *   fetchCount()
 *     → GET /api/notifications/unread-count
 *       Lightweight badge refresh. Context handles polling automatically —
 *       only call this manually if you need an immediate count update.
 *
 *   markRead(notificationId)
 *     → PUT /api/notifications/:id/read
 *       Marks one notification as read. Optimistically updates the list
 *       and decrements unreadCount in context.
 *
 *   markAllRead()
 *     → PUT /api/notifications/read-all
 *       Marks every notification as read, sets unreadCount to 0.
 *
 *   removeNotification(notificationId)
 *     → DELETE /api/notifications/:id
 *       Removes one notification from the list.
 *
 *   clearAll()
 *     → DELETE /api/notifications
 *       Wipes the entire notification list and resets unreadCount to 0.
 *
 * ─── DERIVED HELPERS (computed, no API calls) ─────────────────────────────
 *   unreadNotifications  → notifications filtered to isRead === false
 *   hasUnread            → boolean shorthand for unreadCount > 0
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────
 *   // Navbar badge
 *   const { unreadCount, hasUnread } = useNotifications();
 *
 *   // Notification panel / dropdown
 *   const { notifications, loading, markRead, markAllRead, clearAll } = useNotifications();
 *
 *   // After an action that triggers a new notification
 *   const { fetchNotifications } = useNotifications();
 *   await acceptRequest(...);
 *   fetchNotifications(); // refresh so the new notification appears immediately
 *
 * ─── THROWS ───────────────────────────────────────────────────────────────
 *   If used outside <NotificationProvider>, throws with a clear message.
 *   NotificationProvider must be inside AuthProvider (it reads isAuthenticated).
 */

const useNotifications = () => {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error(
      '[useNotifications] must be used inside <NotificationProvider>. ' +
      'Make sure NotificationProvider wraps your component tree in App.jsx, ' +
      'and that it sits inside <AuthProvider> (it depends on useAuth internally).'
    );
  }

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchCount,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  } = ctx;

  // ─── Derived helpers ────────────────────────────────────────────────────
  // Computed here rather than in context to keep context lean.
  // These are cheap array operations so no useMemo needed.

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadCount > 0;

  return {
    // State
    notifications,
    unreadCount,
    loading,

    // Actions
    fetchNotifications,
    fetchCount,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,

    // Derived
    unreadNotifications,
    hasUnread,
  };
};

export default useNotifications;
export { useNotifications };