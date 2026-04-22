// src/components/common/Modal.jsx
import React, { useEffect, useCallback } from 'react';

// ─── Modal ────────────────────────────────────────────────────────────────────
/**
 * Modal — universal dialog component built on the design system's
 * .modal-overlay, .modal, .modal-header, .modal-body, .modal-footer
 * classes from index.css.
 *
 * Props:
 *   isOpen      {boolean}   controls visibility — required
 *   onClose     {fn}        called on overlay click, X button, or Escape key
 *   title       {string}    header title text
 *   icon        {string}    emoji shown before title e.g. "⚠️"
 *   children    {node}      modal body content
 *   footer      {node}      custom footer content — overrides confirm/cancel
 *
 *   Confirm/cancel shorthand (ignored if footer is provided):
 *   onConfirm       {fn}      confirm button handler
 *   confirmLabel    {string}  confirm button text       default: 'Confirm'
 *   confirmVariant  'primary' | 'danger'                default: 'primary'
 *   cancelLabel     {string}  cancel button text        default: 'Cancel'
 *   loading         {boolean} disables buttons + shows spinner on confirm
 *
 *   size        'sm' | 'md' | 'lg'    default: 'md'
 *   closeOnOverlay {boolean}          default: true
 *
 * USAGE:
 *
 * // Simple confirm/cancel — delete action
 * <Modal
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   title="Delete Request"
 *   icon="🗑"
 *   onConfirm={handleDelete}
 *   confirmLabel="Delete"
 *   confirmVariant="danger"
 *   loading={actionLoading}
 * >
 *   Are you sure you want to delete this request? This cannot be undone.
 * </Modal>
 *
 * // Custom footer — rating form
 * <Modal
 *   isOpen={showRating}
 *   onClose={() => setShowRating(false)}
 *   title="Rate Volunteer"
 *   icon="⭐"
 *   footer={<button className="btn btn-primary" onClick={submitRating}>Submit</button>}
 * >
 *   <RatingForm ... />
 * </Modal>
 *
 * // Info only — no footer
 * <Modal isOpen={showInfo} onClose={closeInfo} title="How it works">
 *   <p>...</p>
 * </Modal>
 */
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
    // Lock body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // ── Don't render anything when closed ─────────────────────────────────────
  if (!isOpen) return null;

  const maxWidths = { sm: '380px', md: '480px', lg: '600px' };

  const confirmBtnClass =
    confirmVariant === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-primary';

  // ── Determine footer content ───────────────────────────────────────────────
  // If footer prop is passed → use it directly
  // If onConfirm is passed  → render confirm + cancel buttons
  // Otherwise               → no footer
  const hasFooter = footer !== undefined || typeof onConfirm === 'function';

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlay && !loading ? onClose : undefined}
    >
      <div
        className="modal"
        style={{ maxWidth: maxWidths[size] }}
        onClick={(e) => e.stopPropagation()}
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
                  onClick={onConfirm}
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