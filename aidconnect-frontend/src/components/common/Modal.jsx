import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  onConfirm,
  confirmLabel   = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel    = 'Cancel',
  loading        = false,
  size           = 'md',
  closeOnOverlay = true,
}) {
  const canUsePortal = typeof document !== 'undefined';
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
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = { sm: '380px', md: '480px', lg: '600px' };

  const confirmBtnClass =
    confirmVariant === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-primary';

  const hasFooter = footer !== undefined || typeof onConfirm === 'function';

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnOverlay && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        style={{ maxWidth: maxWidths[size] }}
      >
<div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
            {title}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
<div className="modal-body">
          {typeof children === 'string' ? (
            <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7, margin: 0 }}>
              {children}
            </p>
          ) : (
            children
          )}
        </div>
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

  return canUsePortal ? createPortal(modalContent, document.body) : modalContent;
}