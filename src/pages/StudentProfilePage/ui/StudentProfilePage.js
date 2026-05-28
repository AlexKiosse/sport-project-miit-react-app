import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '/shared/ui/cabinet';
import { CabinetLayout } from '/widgets/cabinet-layout';
import { UserProfileContent } from '/widgets/user-profile';
import {
  getStudentSession,
  clearStudentSession,
  setStudentSession,
} from '/shared/lib/session/studentSession';

export const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStudentSession());
  const [login, setLogin] = useState(() => getStudentSession()?.login ?? '');

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  const handleLogout = () => {
    clearStudentSession();
    navigate('/');
  };

  const handleProfileUpdated = (updated) => {
    setStudentSession(updated);
    setSession(getStudentSession());
    setLogin(updated.login);
  };

  if (!session) {
    return null;
  }

  return (
    <CabinetLayout
      pageClassName="student-page student-profile-page"
      mainClassName="student-main"
      sidebarClassName="student-sidebar"
      badge="ПРОФИЛЬ СТУДЕНТА"
      badgeClassName="student-badge"
      rightContent={
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      }
      sidebar={
        <div className="sidebar-section">
          <h3>Навигация</h3>
          <button
            type="button"
            className="sidebar-btn"
            onClick={() => navigate('/student')}
          >
            ← Кабинет студента
          </button>
          <button type="button" className="sidebar-btn active">
            👤 Мой профиль
          </button>
        </div>
      }
    >
      <UserProfileContent
        role="student"
        login={login}
        backTo="/student"
        onProfileUpdated={handleProfileUpdated}
      />
    </CabinetLayout>
  );
};
