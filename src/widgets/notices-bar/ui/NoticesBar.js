import React from 'react';

/**
 * @param {{
 *   error?: string,
 *   notice?: { variant?: string, text?: string },
 *   onDismissError?: () => void,
 *   onDismissNotice?: () => void,
 *   reserveSlots?: boolean,
 *   className?: string,
 * }} props
 */
export const NoticesBar = ({
  error = '',
  notice = { variant: '', text: '' },
  onDismissError,
  onDismissNotice,
  reserveSlots = false,
  className = '',
}) => {
  const hasContent = Boolean(error || notice.text);
  if (!hasContent && !reserveSlots) return null;

  const rootClass = [
    'admin-notices',
    className,
    reserveSlots ? 'teacher-notices' : '',
    reserveSlots && hasContent ? 'teacher-notices--visible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} aria-live="polite">
      {error ? (
        <div className="form-alert form-alert--error" role="alert">
          <span className="form-alert-text">{error}</span>
          <button
            type="button"
            className="form-alert-dismiss"
            onClick={onDismissError}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ) : reserveSlots ? (
        <div className="teacher-notice-slot" aria-hidden />
      ) : null}
      {notice.text ? (
        <div className={`form-alert form-alert--${notice.variant}`} role="status">
          <span className="form-alert-text">{notice.text}</span>
          <button
            type="button"
            className="form-alert-dismiss"
            onClick={onDismissNotice}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ) : reserveSlots ? (
        <div className="teacher-notice-slot" aria-hidden />
      ) : null}
    </div>
  );
};
