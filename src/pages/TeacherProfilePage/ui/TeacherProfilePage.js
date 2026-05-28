import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '/shared/ui/cabinet';
import { CabinetLayout } from '/widgets/cabinet-layout';
import { UserProfileContent } from '/widgets/user-profile';
import {
  getTeacherSession,
  clearTeacherSession,
  setTeacherSession,
} from '/shared/lib/session/teacherSession';

export const TeacherProfilePage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getTeacherSession());
  const [login, setLogin] = useState(() => getTeacherSession()?.login ?? '');

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  const handleLogout = () => {
    clearTeacherSession();
    navigate('/');
  };

  const handleProfileUpdated = (updated) => {
    setTeacherSession({
      ...updated,
      role: updated.moderator ? 'moderator' : 'teacher',
      isModerator: updated.moderator === true,
    });
    setSession(getTeacherSession());
    setLogin(updated.login);
  };

  if (!session) {
    return null;
  }

  return (
    <CabinetLayout
      pageClassName="teacher-page teacher-profile-page"
      mainClassName="teacher-main"
      sidebarClassName="teacher-sidebar"
      badge="ПРОФИЛЬ ПРЕПОДАВАТЕЛЯ"
      badgeClassName="teacher-badge"
      rightContent={
        <>
          {session.isModerator ? (
            <button
              type="button"
              className="teacher-admin-link"
              onClick={() => navigate('/admin')}
            >
              Админ-панель
            </button>
          ) : null}
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </>
      }
      sidebar={
        <div className="sidebar-section">
          <h3>Навигация</h3>
          <button
            type="button"
            className="sidebar-btn"
            onClick={() => navigate('/teacher')}
          >
            ← Кабинет преподавателя
          </button>
          <button type="button" className="sidebar-btn active">
            👤 Мой профиль
          </button>
        </div>
      }
    >
      <UserProfileContent
        role="teacher"
        login={login}
        backTo="/teacher"
        onProfileUpdated={handleProfileUpdated}
      />
    </CabinetLayout>
  );
};
