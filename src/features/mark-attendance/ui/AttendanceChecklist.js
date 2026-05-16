import React from 'react';
import { PanelOverlay } from '/shared/ui/panel-overlay';

/**
 * @param {{
 *   rows: Array<{ login: string, name?: string }>,
 *   draft: Record<string, boolean>,
 *   onToggle: (login: string, present: boolean) => void,
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   className?: string,
 * }} props
 */
export const AttendanceChecklist = ({
  rows,
  draft,
  onToggle,
  loading = false,
  emptyMessage = 'Нет студентов на этом занятии',
  className = '',
}) => {
  const rootClass = ['attendance-checklist', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {rows.length === 0 && !loading ? (
        <p className="teacher-empty-hint">{emptyMessage}</p>
      ) : (
        rows.map((row) => (
          <label key={row.login} className="attendance-check-item">
            <input
              type="checkbox"
              checked={draft[row.login] === true}
              onChange={(e) => onToggle(row.login, e.target.checked)}
            />
            <span className="attendance-check-name">{row.name}</span>
            <span className="attendance-check-login mono">{row.login}</span>
            <span
              className={`attendance-pill ${draft[row.login] ? 'present' : 'absent'}`}
            >
              <span className="attendance-pill-text">
                {draft[row.login] ? 'Был' : 'Нет'}
              </span>
            </span>
          </label>
        ))
      )}
      <PanelOverlay show={loading} label="Загрузка списка…" />
    </div>
  );
};
