import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, parseISO, compareAsc, isAfter, startOfToday } from 'date-fns';
import '/shared/ui/cabinet';
import './StudentPage.css';
import { CabinetLayout } from '/widgets/cabinet-layout';
import { NoticesBar } from '/widgets/notices-bar';
import { PanelOverlay } from '/shared/ui/panel-overlay';
import { sectionsApi } from '/entities/section';
import { lessonsApi } from '/entities/lesson';
import { visitsApi } from '/entities/visit';
import { studentsApi } from '/entities/student';
import {
  getStudentSession,
  clearStudentSession,
  formatPersonName,
} from '/shared/lib/session/studentSession';
import { formatLessonDate } from '/shared/lib/format/formatLessonDate';

export const StudentPage = () => {
  const navigate = useNavigate();
  const sessionRef = useRef(getStudentSession());
  const session = sessionRef.current;

  const [activeTab, setActiveTab] = useState('schedule');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ variant: '', text: '' });

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [schedule, setSchedule] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [bookingLessonId, setBookingLessonId] = useState(null);
  const [myVisitLessonIds, setMyVisitLessonIds] = useState(new Set());

  const loadProfile = useCallback(async () => {
    if (!session?.login) return;
    setProfileLoading(true);
    try {
      const data = await studentsApi.getStudentByLogin(session.login);
      setProfile(data);
      if (data?.sectionId) {
        setSelectedSectionId(String(data.sectionId));
      }
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить профиль');
    } finally {
      setProfileLoading(false);
    }
  }, [session?.login]);

  const loadSchedule = useCallback(async () => {
    if (!session?.login) return;
    setScheduleLoading(true);
    try {
      const data = await studentsApi.getSchedule(session.login);
      setSchedule(data && typeof data === 'object' ? data : {});
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить расписание');
    } finally {
      setScheduleLoading(false);
    }
  }, [session?.login]);

  const loadSections = useCallback(async () => {
    try {
      const data = await sectionsApi.getAll();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadUpcomingLessons = useCallback(async () => {
    setLessonsLoading(true);
    try {
      const from = format(startOfToday(), 'yyyy-MM-dd');
      const to = format(addMonths(startOfToday(), 3), 'yyyy-MM-dd');
      const [lessons, visits] = await Promise.all([
        lessonsApi.findByDateRange(from, to),
        session?.login ? visitsApi.findByStudent(session.login) : Promise.resolve([]),
      ]);
      const today = startOfToday();
      const upcoming = (Array.isArray(lessons) ? lessons : [])
        .filter((l) => l?.dateOfLesson && !isAfter(today, parseISO(l.dateOfLesson)))
        .sort((a, b) => compareAsc(parseISO(a.dateOfLesson), parseISO(b.dateOfLesson)));
      setUpcomingLessons(upcoming);
      const ids = new Set(
        (Array.isArray(visits) ? visits : []).map((v) => v.lessonId).filter(Boolean)
      );
      setMyVisitLessonIds(ids);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить список тренировок');
    } finally {
      setLessonsLoading(false);
    }
  }, [session?.login]);

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    loadProfile();
  }, [session, navigate, loadProfile]);

  useEffect(() => {
    if (!session) return;
    if (activeTab === 'schedule') loadSchedule();
    if (activeTab === 'section') loadSections();
    if (activeTab === 'training') loadUpcomingLessons();
  }, [activeTab, session, loadSchedule, loadSections, loadUpcomingLessons]);

  const handleLogout = () => {
    clearStudentSession();
    navigate('/');
  };

  const handleEnrollSection = async () => {
    if (!selectedSectionId || !session?.login) return;
    setEnrolling(true);
    setError('');
    try {
      const updated = await studentsApi.enrollSection(session.login, Number(selectedSectionId));
      setProfile(updated);
      setNotice({
        variant: 'success',
        text: `Вы записаны в секцию «${updated.sectionName || 'секция'}»`,
      });
    } catch (err) {
      console.error(err);
      setError('Не удалось записаться в секцию');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBookLesson = async (lessonId) => {
    if (!session?.login) return;
    setBookingLessonId(lessonId);
    setError('');
    try {
      await visitsApi.bookLesson(session.login, lessonId);
      setMyVisitLessonIds((prev) => new Set([...prev, lessonId]));
      setNotice({ variant: 'success', text: 'Вы записаны на тренировку' });
      loadSchedule();
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || 'Не удалось записаться на тренировку (возможно, вы уже записаны)');
    } finally {
      setBookingLessonId(null);
    }
  };

  const scheduleEntries = useMemo(() => {
    return Object.entries(schedule).sort(([a], [b]) => compareAsc(parseISO(a), parseISO(b)));
  }, [schedule]);

  if (!session) {
    return null;
  }

  const studentName = formatPersonName(session);

  return (
    <CabinetLayout
      pageClassName="student-page"
      mainClassName="student-main"
      sidebarClassName="student-sidebar"
      badge="КАБИНЕТ СТУДЕНТА"
      badgeClassName="student-badge"
      rightContent={
        <>
          <span className="student-greeting">{studentName}</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </>
      }
      sidebar={
        <>
          <div className="sidebar-section">
            <h3>Разделы</h3>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              📅 Расписание
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'section' ? 'active' : ''}`}
              onClick={() => setActiveTab('section')}
            >
              🏃 Спортивная секция
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              ✅ Запись на тренировку
            </button>
          </div>
          <div className="sidebar-section student-sidebar-stats">
            <h3>Профиль</h3>
            <div className="stat-item">
              <span>Группа</span>
              <strong>{profile?.groupName || '—'}</strong>
            </div>
            <div className="stat-item">
              <span>Секция</span>
              <strong>{profile?.sectionName || 'не выбрана'}</strong>
            </div>
            <div className="stat-item">
              <span>Мед. группа</span>
              <strong>{profile?.healthGroup ?? '—'}</strong>
            </div>
          </div>
        </>
      }
    >
      <NoticesBar
        error={error}
        notice={notice}
        reserveSlots
        onDismissError={() => setError('')}
        onDismissNotice={() => setNotice({ variant: '', text: '' })}
      />

      <div className="student-panels">
        <div
          className={`student-panel${activeTab === 'schedule' ? ' student-panel--active' : ''}`}
        >
          <div className="table-wrapper student-panel-body">
            <div className="table-header">
              <p className="subtitle">Моё расписание занятий</p>
            </div>
            <table className="students-table">
              <thead>
                <tr>
                  <th>ДАТА</th>
                  <th>ЗАНЯТИЕ</th>
                </tr>
              </thead>
              <tbody>
                {scheduleEntries.length === 0 ? (
                  <tr className="student-placeholder-row">
                    <td colSpan={2}>
                      {scheduleLoading || profileLoading
                        ? 'Загрузка…'
                        : 'Записей в расписании пока нет — запишитесь на тренировку'}
                    </td>
                  </tr>
                ) : (
                  scheduleEntries.map(([dateKey, label]) => (
                    <tr key={dateKey}>
                      <td>{formatLessonDate(dateKey)}</td>
                      <td>{label}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PanelOverlay show={scheduleLoading && scheduleEntries.length > 0} />
          </div>
        </div>

        <div
          className={`student-panel${activeTab === 'section' ? ' student-panel--active' : ''}`}
        >
          <div className="add-user-panel student-panel-body">
            <div className="panel-header">
              <h2>🏃 Запись в спортивную секцию</h2>
              <p>
                {profile?.sectionName
                  ? `Вы состоите в секции «${profile.sectionName}»`
                  : 'Выберите секцию и подтвердите запись'}
              </p>
            </div>
            <div className="form-row student-section-row">
              <div className="form-group">
                <label htmlFor="student-section-select">Секция</label>
                <select
                  id="student-section-select"
                  className="form-input"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={enrolling}
                >
                  <option value="">— выберите секцию —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group student-section-actions">
                <span className="student-field-spacer" aria-hidden="true" />
                <button
                  type="button"
                  className="submit-btn"
                  disabled={!selectedSectionId || enrolling}
                  onClick={handleEnrollSection}
                >
                  {enrolling ? 'Запись…' : 'Записаться в секцию'}
                </button>
              </div>
            </div>
            {profile?.sectionName ? (
              <p className="student-hint">
                Преподаватель увидит вас в списке участников секции после записи.
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`student-panel${activeTab === 'training' ? ' student-panel--active' : ''}`}
        >
          <div className="table-wrapper student-panel-body">
            <div className="table-header">
              <p className="subtitle">Ближайшие тренировки — запись на занятие</p>
            </div>
            <table className="students-table">
              <thead>
                <tr>
                  <th>ДАТА</th>
                  <th>ВРЕМЯ</th>
                  <th>ДИСЦИПЛИНА</th>
                  <th>ПРЕПОДАВАТЕЛЬ</th>
                  <th>ДЕЙСТВИЕ</th>
                </tr>
              </thead>
              <tbody>
                {upcomingLessons.length === 0 ? (
                  <tr className="student-placeholder-row">
                    <td colSpan={5}>
                      {lessonsLoading ? 'Загрузка…' : 'Нет доступных тренировок'}
                    </td>
                  </tr>
                ) : (
                  upcomingLessons.map((lesson) => {
                    const booked = myVisitLessonIds.has(lesson.id);
                    return (
                      <tr key={lesson.id}>
                        <td>{formatLessonDate(lesson.dateOfLesson)}</td>
                        <td>
                          {lesson.startAt} – {lesson.endAt}
                        </td>
                        <td>{lesson.disciplineName || '—'}</td>
                        <td>{lesson.teacherFullName || '—'}</td>
                        <td>
                          {booked ? (
                            <span className="student-booked-label">Записан</span>
                          ) : (
                            <button
                              type="button"
                              className="teacher-action-link"
                              disabled={bookingLessonId === lesson.id}
                              onClick={() => handleBookLesson(lesson.id)}
                            >
                              {bookingLessonId === lesson.id ? 'Запись…' : 'Записаться →'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <PanelOverlay show={lessonsLoading && upcomingLessons.length > 0} />
          </div>
        </div>
      </div>
    </CabinetLayout>
  );
};
