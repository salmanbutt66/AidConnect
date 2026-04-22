// src/components/dashboard/NotificationPanel.jsx
import React, { useEffect } from 'react';
import useNotifications from '../../hooks/useNotifications.js';
import { formatTimeAgo } from '../../utils/formatters.js';
import { NOTIFICATION_TYPES } from '../../utils/constants.js';

// ─── Notification type meta lookup ───────────────────────────────────────────
function getNotifMeta(type) {
  return (
    NOTIFICATION_TYPES[type] || { label: 'Notification', emoji: '🔔' }
  );
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifRow({ notif, onRead, onRemove }) {
  const meta = getNotifMeta(notif.type);

  return (
    <div
      className={`feed-item${!notif.isRead ? ' unread' : ''}`}
      style={{
        background: notif.isRead ? 'transparent' : 'var(--green-50)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: '2px',
        cursor: notif.isRead ? 'default' : 'pointer',
        transition: 'background var(--t-fast)',
        border: notif.isRead
          ? '1px solid transparent'
          : '1px solid var(--green-200)',
      }}
      onClick={() => !notif.isRead && onRead(notif._id)}
    >
      {/* Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: notif.isRead ? 'var(--stone-200)' : 'var(--green-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
        }}
      >
        {meta.emoji}
      </div>

      {/* Content */}
      <div className="feed-content" style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontWeight: notif.isRead ? 500 : 700,
            color: notif.isRead ? 'var(--text-mid)' : 'var(--text-dark)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {notif.title}
        </h4>
        <p
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'var(--text-muted)',
          }}
        >
          {notif.message}
        </p>
        <span className="feed-time">{formatTimeAgo(notif.createdAt)}</span>
      </div>

      {/* Right side: unread dot + delete */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {!notif.isRead && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--green-500)',
            }}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notif._id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text-light)',
            padding: '2px 4px',
            borderRadius: 'var(--radius-xs)',
            lineHeight: 1,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
          aria-label="Delete notification"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyNotifications() {
  return (
    <div className="empty-state" style={{ padding: '40px 16px' }}>
      <div className="empty-state-icon">🔕</div>
      <h3>All caught up</h3>
      <p>No notifications yet. We'll let you know when something needs your attention.</p>
    </div>
  );
}

// ─── NotificationPanel ────────────────────────────────────────────────────────
/**
 * NotificationPanel — full notification list for dashboard pages.
 *
 * Renders inside a card on any dashboard page that needs a dedicated
 * notifications section (e.g. UserDashboard, VolunteerDashboard).
 * The Navbar already handles the dropdown bell — this is the full panel.
 *
 * Props:
 *   limit    {number}   max notifications to show     default: 10
 *   showHeader {boolean} show the panel header         default: true
 *
 * Usage:
 *   // Inside UserDashboard
 *   <NotificationPanel />
 *
 *   // Compact — no header, fewer items
 *   <NotificationPanel limit={5} showHeader={false} />
 */
export default function NotificationPanel({ limit = 10, showHeader = true }) {
  const {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    clearAll,
    removeNotification,
  } = useNotifications();

  // Fetch fresh on mount
  useEffect(() => {
    fetchNotifications({ limit });
  }, [limit]);

  const visible = notifications.slice(0, limit);

  return (
    <div className="card" style={{ height: '100%' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      {showHeader && (
        <div className="card-header">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔔 Notifications
                {hasUnread && (
                  <span className="badge badge-green" style={{ fontSize: '10px' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="section-subtitle">
                {hasUnread
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up'
                }
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {hasUnread && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={markAllRead}
                    style={{ fontSize: '12px' }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={clearAll}
                  style={{ fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="card-body" style={{ paddingTop: showHeader ? '16px' : '24px' }}>
        {loading ? (
          // Skeleton rows while loading
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  alignItems: 'center',
                }}
              >
                <div
                  className="skeleton"
                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ height: '13px', width: '55%' }} />
                  <div className="skeleton" style={{ height: '11px', width: '80%' }} />
                  <div className="skeleton" style={{ height: '10px', width: '25%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visible.map((notif) => (
              <NotifRow
                key={notif._id}
                notif={notif}
                onRead={markRead}
                onRemove={removeNotification}
              />
            ))}

            {/* Show more hint */}
            {notifications.length > limit && (
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Showing {limit} of {notifications.length} notifications
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}