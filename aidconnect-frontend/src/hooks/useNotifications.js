import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext.jsx';

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

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchCount,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    unreadNotifications,
    hasUnread,
  };
};

export default useNotifications;
export { useNotifications };