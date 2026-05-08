import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../api/notification.api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [isAuthenticated]);
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getMyNotifications({ limit: 20, ...params });
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications, fetchCount]);
  const markRead = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);
  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === notificationId);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    } catch {}
  }, []);
  const clearAll = useCallback(async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchCount,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;