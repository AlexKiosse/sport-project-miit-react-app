import React from 'react';

/**
 * @param {{ badge?: string, badgeClassName?: string, rightContent?: React.ReactNode }} props
 */
export const CabinetHeader = ({ badge, badgeClassName = '', rightContent }) => (
  <nav className="navbar">
    <div className="nav-container">
      <div className="nav-left">
        <h1 className="logo">
          РУТ <span>СПОРТ</span>
        </h1>
        {badge ? (
          <span className={`admin-badge ${badgeClassName}`.trim()}>{badge}</span>
        ) : null}
      </div>
      <div className="nav-right">{rightContent}</div>
    </div>
  </nav>
);
