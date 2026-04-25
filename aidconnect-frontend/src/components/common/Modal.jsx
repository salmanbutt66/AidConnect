// src/components/common/Modal.jsx
import React, { useEffect, useCallback } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,

  // Confirm/cancel shorthand
  onConfirm,
  confirmLabel   = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel    = 'Cancel',
  loading        = false,

  // Config
  size            = 'md',
  closeOnOverlay  = true,
}) {

  // ── Close on Escape key ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) onClose();
  }, [onClose, loading]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidths = { sm: '380px', md: '480px', lg: '600px' };

  const confirmBtnClass =
    confirmVariant === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-primary';

  const hasFooter = footer !== undefined || typeof onConfirm === 'function';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // Only close if clicking the overlay itself, not its children
        if (e.target === e.currentTarget && closeOnOverlay && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        style={{ maxWidth: maxWidths[size] }}
      >

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
            {title}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="modal-body">
          {typeof children === 'string' ? (
            <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7, margin: 0 }}>
              {children}
            </p>
          ) : (
            children
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {hasFooter && (
          <div className="modal-footer">
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelLabel}
                </button>
                <button
                  className={confirmBtnClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onConfirm) onConfirm();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      {confirmLabel}…
                    </>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}