import React from 'react';

/**
 * @param {{ show: boolean, label?: string }} props
 */
export const PanelOverlay = ({ show, label = 'Загрузка…' }) => {
  if (!show) return null;
  return (
    <div className="panel-overlay" aria-busy="true" aria-live="polite">
      <div className="spinner-circle" aria-hidden />
      <p>{label}</p>
    </div>
  );
};
