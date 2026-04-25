// src/components/common/Navbar.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useNotifications from '../../hooks/useNotifications.js';
import { getInitials, formatTimeAgo, formatRole } from '../../utils/formatters.js';
import { APP_NAME } from '../../utils/constants.js';

// ─── Navigation config per role ───────────────────────────────────────────────
const NAV_LINKS = {
  user: [
    { to: '/user/dashboard',      icon: '🏠', label: 'Dashboard'     },
    { to: '/user/create-request', icon: '🆘', label: 'New Request'   },
    { to: '/user/my-requests',    icon: '📋', label: 'My Requests'   },
    { to: '/user/profile',        icon: '👤', label: 'Profile'       },
  ],
  volunteer: [
    { to: '/volunteer/dashboard',       icon: '🏠', label: 'Dashboard'      },
    { to: '/volunteer/active-request',  icon: '🚨', label: 'Active Request' },
    { to: '/volunteer/history',         icon: '📋', label: 'My History'     },
    { to: '/volunteer/profile',         icon: '👤', label: 'Profile'        },
  ],
  provider: [
    { to: '/provider/dashboard',    icon: '🏠', label: 'Dashboard'    },
    { to: '/provider/availability', icon: '🔄', label: 'Availability' },
    { to: '/provider/profile',      icon: '🏥', label: 'Profile'      },
  ],
  admin: [
    { to: '/admin/dashboard',   icon: '🏠', label: 'Dashboard'   },
    { to: '/admin/users',       icon: '👥', label: 'Users'        },
    { to: '/admin/requests',    icon: '🆘', label: 'Requests'     },
    { to: '/admin/volunteers',  icon: '🤝', label: 'Volunteers'   },
    { to: '/admin/providers',   icon: '🏥', label: 'Providers'    },
    { to: '/admin/analytics',   icon: '📊', label: 'Analytics'    },
  ],
};

// ─── Section labels per role ──────────────────────────────────────────────────
const NAV_SECTIONS = {
  user:      'Citizen',
  volunteer: 'Responder',
  provider:  'Organization',
  admin:     'Administration',
};

// ─── Notification item ────────────────────────────────────────────────────────
function NotifItem({ notif, onRead }) {
  return (
    <div
      className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
      onClick={() => onRead(notif._id)}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: notif.isRead ? 'var(--stone-200)' : 'var(--green-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          flexShrink: 0,
        }}
      >
        {notif.isRead ? '🔔' : '🔔'}
      </div>
      <div className="notif-item-content" style={{ flex: 1, minWidth: 0 }}>
        <h5 style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {notif.title}
        </h5>
        <p style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {notif.message}
        </p>
        <time>{formatTimeAgo(notif.createdAt)}</time>
      </div>
      {!notif.isRead && (
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--green-500)',
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
      )}
    </div>
  );
}

// ─── Navbar (Sidebar + Topbar layout wrapper) ─────────────────────────────────
export default function Navbar({ title, children }) {
  const { user, logout, isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    hasUnread,
    loading: notifLoading,
    markRead,
    markAllRead,
    clearAll,
    fetchNotifications,
  } = useNotifications();

  const navigate = useNavigate();

  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);

  const notifRef   = useRef(null);
  const userRef    = useRef(null);

  const navLinks = NAV_LINKS[user?.role] || [];
  const section  = NAV_SECTIONS[user?.role] || '';
  const initials = getInitials(user?.name);

  // ── Close dropdowns on outside click ──────────────────────────────────────
  // FIX: changed from mousedown to click so modal confirm buttons
  // aren't interrupted before their click event fires
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Fetch notifications when dropdown opens ────────────────────────────────
  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  // ── Close sidebar on mobile when nav item clicked ─────────────────────────
  const handleNavClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [logout, navigate]);

  // ── Mark notification read + close dropdown ────────────────────────────────
  const handleNotifRead = useCallback(async (id) => {
    await markRead(id);
  }, [markRead]);

  return (
    <div className="app-layout">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🆘</div>
          <div>
            <div className="sidebar-logo-text">{APP_NAME}</div>
            <div className="sidebar-logo-sub">Emergency Network</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {section && (
            <div className="sidebar-section-label">{section}</div>
          )}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
              onClick={handleNavClick}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer — user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setUserMenuOpen((p) => !p)}>
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="sidebar-avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="sidebar-avatar">{initials}</div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{formatRole(user?.role)}</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginLeft: 'auto' }}>
              ⌄
            </span>
          </div>

          {/* User mini-menu */}
          {userMenuOpen && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  color: loggingOut ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!loggingOut) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {loggingOut
                  ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Signing out…</>
                  : <>🚪 Sign Out</>
                }
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div className="app-content">

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header className="topbar">

          {/* Left: hamburger (mobile) + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              style={{
                display: 'none',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--stone-200)',
                background: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: 'pointer',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            {title && <h1 className="topbar-title">{title}</h1>}
          </div>

          {/* Right: notifications + user avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Notification bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="notif-btn"
                onClick={() => setNotifOpen((p) => !p)}
                aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
              >
                🔔
                {hasUnread && (
                  <span className="notif-count">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <h4>
                      Notifications
                      {hasUnread && (
                        <span
                          className="badge badge-green"
                          style={{ marginLeft: '8px', fontSize: '10px' }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </h4>
                    {notifications.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {hasUnread && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={markAllRead}
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={clearAll}
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="notif-dropdown-body">
                    {notifLoading ? (
                      <div style={{ padding: '32px', textAlign: 'center' }}>
                        <span className="spinner spinner-green" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div
                        style={{
                          padding: '40px 24px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔕</div>
                        <p style={{ fontSize: '13px', margin: 0 }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <NotifItem
                          key={notif._id}
                          notif={notif}
                          onRead={handleNotifRead}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar — links to profile */}
            <Link
              to={`/${user?.role}/profile`}
              style={{ textDecoration: 'none' }}
              title={user?.name}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="avatar avatar-sm"
                  style={{ objectFit: 'cover', cursor: 'pointer' }}
                />
              ) : (
                <div className="avatar avatar-sm" style={{ cursor: 'pointer' }}>
                  {initials}
                </div>
              )}
            </Link>

          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="main-inner">
          {children}
        </main>

      </div>

      {/* ── Mobile sidebar overlay backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 199,
            animation: 'fadeIn 200ms var(--ease)',
          }}
        />
      )}

    </div>
  );
}