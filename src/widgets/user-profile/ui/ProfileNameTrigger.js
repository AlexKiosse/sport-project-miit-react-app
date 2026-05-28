import React from 'react';
import { useNavigate } from 'react-router-dom';
import './user-profile.css';

/**
 * @param {{ name: string, to: string, className?: string }} props
 */
export const ProfileNameTrigger = ({ name, to, className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`profile-name-trigger ${className}`.trim()}
      onClick={() => navigate(to)}
      title="Открыть профиль"
    >
      {name}
    </button>
  );
};
