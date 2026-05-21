import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseISO, compareDesc } from 'date-fns';
import '/shared/ui/cabinet';
import './TeacherPage.css';
import { CabinetLayout } from '/widgets/cabinet-layout';
import { NoticesBar } from '/widgets/notices-bar';
import { PanelOverlay } from '/shared/ui/panel-overlay';
import { AttendanceChecklist } from '/features/mark-attendance';
import { lessonsApi } from '/entities/lesson';
import { sectionsApi } from '/entities/section';
import { visitsApi } from '/entities/visit';
import { studentsApi, computeAttendanceFromExist } from '/entities/student';
import {
  computeAttendancePercentUnified,
  computeAbsencesUnified,
} from '/shared/lib/attendance/computeAttendancePercent';
import {
  getTeacherSession,
  clearTeacherSession,
  formatPersonName,
} from '/shared/lib/session/teacherSession';
import { formatLessonDate, formatLessonDateShort } from '/shared/lib/format/formatLessonDate';
import {
  getSectionLastSeen,
  markSectionSeen,
} from '/shared/lib/session/teacherSectionSeen';

const SECTION_SCHEDULE_DATE = '2026-05-22';

function sortLessonsByDate(lessons) {
  return [...lessons].sort((a, b) =>
    compareDesc(parseISO(a.dateOfLesson), parseISO(b.dateOfLesson))
  );
}

function isSectionScheduleDay(dateStr) {
  return dateStr === SECTION_SCHEDULE_DATE;
}

function normalizeVisitPresent(visit) {
  return visit.isExists === true || visit.exists === true;
}

export const TeacherPage = () => {
  const navigate = useNavigate();
  const sessionRef = useRef(getTeacherSession());
  const session = sessionRef.current;

  const [activeTab, setActiveTab] = useState('lessons');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ variant: '', text: '' });

  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sectionStudents, setSectionStudents] = useState([]);
  const sectionsLoadedRef = useRef(false);

  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceDraft, setAttendanceDraft] = useState({});

  const [historyStudentLogin, setHistoryStudentLogin] = useState('');
  const [attendanceMap, setAttendanceMap] = useState(null);
  const [attendancePercent, setAttendancePercent] = useState(null);
  const [totalAbsences, setTotalAbsences] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const attendanceRequestRef = useRef(0);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId]
  );

  const may22ExpectedTotal = useMemo(() => {
    return lessons
      .filter((l) => isSectionScheduleDay(l.dateOfLesson))
      .reduce((sum, l) => sum + (l.expectedStudentCount ?? 0), 0);
  }, [lessons]);

  const may22Lessons = useMemo(
    () => lessons.filter((l) => isSectionScheduleDay(l.dateOfLesson)),
    [lessons]
  );

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  const loadLessons = useCallback(async () => {
    if (!session?.id) return;
    setLessonsLoading(true);
    setError('');
    try {
      const data = await lessonsApi.findByTeacher(session.id);
      setLessons(sortLessonsByDate(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить список занятий');
    } finally {
      setLessonsLoading(false);
    }
  }, [session?.id]);

  const loadSections = useCallback(async () => {
    if (sectionsLoadedRef.current) return;
    try {
      const data = await sectionsApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setSections(list);
      sectionsLoadedRef.current = true;
      if (list.length > 0) {
        setSelectedSectionId((prev) => prev || String(list[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const checkNewSectionMembers = useCallback(async (sectionId) => {
    const since = getSectionLastSeen(sectionId);
    try {
      const enrollments = await sectionsApi.getNewEnrollments(Number(sectionId), since);
      const list = Array.isArray(enrollments) ? enrollments : [];
      if (list.length > 0) {
        const names = list.map((e) => e.studentName || e.studentLogin).join(', ');
        setNotice({
          variant: 'info',
          text: `Новый участник секции: ${names}`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSectionStudents = useCallback(async (sectionId) => {
    if (!sectionId) return;
    setSectionLoading(true);
    try {
      const data = await sectionsApi.getStudentsBySectionId(Number(sectionId));
      setSectionStudents(Array.isArray(data) ? data : []);
      await checkNewSectionMembers(sectionId);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить студентов секции');
      setSectionStudents([]);
    } finally {
      setSectionLoading(false);
    }
  }, [checkNewSectionMembers]);

  const loadLessonAttendance = useCallback(
    async (lessonId) => {
      if (!lessonId) return;
      const requestId = ++attendanceRequestRef.current;
      const lessonDate = lessons.find((l) => l.id === lessonId)?.dateOfLesson ?? null;

      setAttendanceLoading(true);
      try {
        const [visits, expected] = await Promise.all([
          visitsApi.findByLesson(lessonId),
          lessonsApi.getExpectedStudents(lessonId),
        ]);

        if (requestId !== attendanceRequestRef.current) return;

        const visitList = Array.isArray(visits) ? visits : [];
        const expectedList = Array.isArray(expected) ? expected : [];

        const byLogin = new Map();
        visitList.forEach((v) => {
          byLogin.set(v.studentLogin, {
            visitId: v.id,
            login: v.studentLogin,
            present: normalizeVisitPresent(v),
            source: 'visit',
          });
        });
        expectedList.forEach((s) => {
          if (!byLogin.has(s.login)) {
            const present =
              lessonDate && s.exist && typeof s.exist === 'object'
                ? s.exist[lessonDate] === true
                : false;
            byLogin.set(s.login, {
              visitId: null,
              login: s.login,
              present,
              source: 'expected',
              student: s,
            });
          } else {
            byLogin.get(s.login).student = s;
          }
        });

        const rows = Array.from(byLogin.values())
          .map((row) => ({
            ...row,
            name: row.student ? formatPersonName(row.student) : row.login,
          }))
          .sort((a, b) =>
            (a.name || a.login).localeCompare(b.name || b.login, 'ru', {
              sensitivity: 'base',
              numeric: true,
            })
          );

        const draft = {};
        rows.forEach((r) => {
          draft[r.login] = r.present;
        });

        setAttendanceRows(rows);
        setAttendanceDraft(draft);
      } catch (err) {
        if (requestId !== attendanceRequestRef.current) return;
        console.error(err);
        setError('Не удалось загрузить посещаемость занятия');
      } finally {
        if (requestId === attendanceRequestRef.current) {
          setAttendanceLoading(false);
        }
      }
    },
    [lessons]
  );

  useEffect(() => {
    if (session) {
      loadLessons();
    }
  }, [session, loadLessons]);

  useEffect(() => {
    if (activeTab === 'section' || activeTab === 'history') {
      loadSections();
    }
  }, [activeTab, loadSections]);

  useEffect(() => {
    if (selectedSectionId && (activeTab === 'section' || activeTab === 'history')) {
      loadSectionStudents(selectedSectionId);
    }
  }, [selectedSectionId, activeTab, loadSectionStudents]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedLessonId) {
      loadLessonAttendance(selectedLessonId);
    }
  }, [activeTab, selectedLessonId, loadLessonAttendance]);

  const openLessonAttendance = (lessonId) => {
    setSelectedLessonId(lessonId);
    setActiveTab('attendance');
  };

  const handleSaveAttendance = async () => {
    if (!selectedLessonId) return;
    setSavingAttendance(true);
    setNotice({ variant: '', text: '' });
    try {
      await lessonsApi.bulkMarkAttendance(selectedLessonId, attendanceDraft);
      setNotice({ variant: 'success', text: 'Посещаемость сохранена' });
      await loadLessonAttendance(selectedLessonId);
      if (selectedSectionId) {
        loadSectionStudents(selectedSectionId);
      }
      if (historyLoaded && historyStudentLogin) {
        await loadStudentHistory(historyStudentLogin);
      }
    } catch (err) {
      console.error(err);
      setNotice({ variant: 'error', text: 'Не удалось сохранить посещаемость' });
    } finally {
      setSavingAttendance(false);
    }
  };

  const loadStudentHistory = async (login) => {
    if (!login.trim()) {
      setHistoryError('Выберите студента');
      return;
    }
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const trimmedLogin = login.trim();
      const [map, student] = await Promise.all([
        visitsApi.getAttendanceMap(trimmedLogin),
        studentsApi.getStudentByLogin(trimmedLogin).catch(() => null),
      ]);
      const mapData = map && typeof map === 'object' ? map : {};
      const studentFromSection = sectionStudents.find((s) => s.login === trimmedLogin) ?? null;
      const studentForPct = student ?? studentFromSection;

      setAttendanceMap(mapData);
      setAttendancePercent(computeAttendancePercentUnified(studentForPct, mapData));
      setTotalAbsences(computeAbsencesUnified(studentForPct, mapData));
      setHistoryLoaded(true);
    } catch (err) {
      console.error(err);
      setHistoryError('Не удалось загрузить историю посещаемости');
      setAttendanceMap(null);
      setHistoryLoaded(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLogout = () => {
    clearTeacherSession();
    navigate('/');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'section' && selectedSectionId) {
      checkNewSectionMembers(selectedSectionId);
    }
  };

  const handleDismissNotice = () => {
    if (selectedSectionId) {
      markSectionSeen(selectedSectionId);
    }
    setNotice({ variant: '', text: '' });
  };

  const historyDates = useMemo(
    () =>
      attendanceMap
        ? Object.keys(attendanceMap).sort((a, b) => compareDesc(parseISO(a), parseISO(b)))
        : [],
    [attendanceMap]
  );

  const studentOptions = useMemo(() => {
    const map = new Map();
    sectionStudents.forEach((s) => {
      if (s.login) map.set(s.login, { login: s.login, name: formatPersonName(s) });
    });
    attendanceRows.forEach((r) => {
      if (r.login) map.set(r.login, { login: r.login, name: r.name || r.login });
    });
    return Array.from(map.values());
  }, [sectionStudents, attendanceRows]);

  if (!session) {
    return null;
  }

  const teacherName = formatPersonName(session);
  const sectionStudentCount = sectionStudents.length;

  return (
    <CabinetLayout
      pageClassName="teacher-page"
      mainClassName="teacher-main"
      sidebarClassName="teacher-sidebar"
      badge="КАБИНЕТ ПРЕПОДАВАТЕЛЯ"
      badgeClassName="teacher-badge"
      rightContent={
        <>
          <span className="teacher-greeting">{teacherName}</span>
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
        <>
          <div className="sidebar-section">
            <h3>Разделы</h3>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => handleTabChange('lessons')}
            >
              📅 Мои пары
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'section' ? 'active' : ''}`}
              onClick={() => handleTabChange('section')}
            >
              👥 Студенты секции
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => handleTabChange('attendance')}
            >
              ✅ Отметить посещаемость
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
              📊 История посещаемости
            </button>
          </div>

          <div className="sidebar-section teacher-sidebar-stats">
            <h3>Сводка</h3>
            <div className="stat-item">
              <span>Занятий в семестре</span>
              <strong>{lessons.length}</strong>
            </div>
            <div className="stat-item">
              <span>Студентов в секции</span>
              <strong>{sectionStudentCount > 0 ? sectionStudentCount : '—'}</strong>
            </div>
            <div className="stat-item stat-item--lesson">
              <span>Текущая пара</span>
              {selectedLesson ? (
                <>
                  <strong>{formatLessonDateShort(selectedLesson.dateOfLesson)}</strong>
                  <small>
                    {selectedLesson.startAt}–{selectedLesson.endAt}
                  </small>
                </>
              ) : (
                <strong className="stat-placeholder">—</strong>
              )}
            </div>
            {may22Lessons.length > 0 ? (
              <div className="stat-item stat-item--may22">
                <span>22 мая — ожидается</span>
                <strong>{may22ExpectedTotal}</strong>
                <small>чел. на {may22Lessons.length} тренировк.</small>
              </div>
            ) : null}
          </div>
        </>
      }
    >
      <NoticesBar
        error={error}
        notice={notice}
        reserveSlots
        onDismissError={() => setError('')}
        onDismissNotice={handleDismissNotice}
      />

          <div className="teacher-panels">
            <div
              className={`teacher-panel${activeTab === 'lessons' ? ' teacher-panel--active' : ''}`}
            >
              <div className="table-wrapper teacher-panel-body">
                <div className="table-header">
                  <p className="subtitle">Мои занятия | {session.login}</p>
                  {may22Lessons.length > 0 ? (
                    <p className="teacher-may22-summary">
                      22 мая 2026: ожидается{' '}
                      <strong>{may22ExpectedTotal}</strong> человек на тренировки секции
                    </p>
                  ) : null}
                </div>
                <table className="students-table lessons-table">
                  <thead>
                    <tr>
                      <th>ДАТА</th>
                      <th>ВРЕМЯ</th>
                      <th>ДИСЦИПЛИНА</th>
                      <th>ОЖИДАЕТСЯ</th>
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.length === 0 ? (
                      <tr className="teacher-placeholder-row">
                        <td colSpan={5}>
                          {lessonsLoading ? 'Загрузка…' : 'Занятий пока нет'}
                        </td>
                      </tr>
                    ) : (
                      lessons.map((lesson) => (
                        <tr
                          key={lesson.id}
                          className={[
                            selectedLessonId === lesson.id ? 'lesson-row--selected' : '',
                            isSectionScheduleDay(lesson.dateOfLesson) ? 'lesson-row--may22' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <td>{formatLessonDate(lesson.dateOfLesson)}</td>
                          <td>
                            {lesson.startAt} – {lesson.endAt}
                          </td>
                          <td>{lesson.disciplineName || '—'}</td>
                          <td className="teacher-expected-cell">
                            <span className="teacher-expected-count">
                              {lesson.expectedStudentCount ?? 0}
                            </span>
                            <span className="teacher-expected-label">чел.</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="teacher-action-link"
                              onClick={() => openLessonAttendance(lesson.id)}
                            >
                              Отметить посещаемость →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <PanelOverlay show={lessonsLoading && lessons.length > 0} />
              </div>
            </div>

            <div
              className={`teacher-panel${activeTab === 'section' ? ' teacher-panel--active' : ''}`}
            >
              <div className="add-user-panel teacher-panel-body">
                <div className="panel-header">
                  <h2>👥 Студенты спортивной секции</h2>
                  <p>Список студентов, записанных на выбранную секцию</p>
                </div>
                <div className="form-row teacher-section-row">
                  <div className="form-group">
                    <label htmlFor="teacher-section-select">Секция</label>
                    <select
                      id="teacher-section-select"
                      className="form-input"
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                      {sections.length === 0 ? (
                        <option value="">Нет секций</option>
                      ) : (
                        sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
                <div className="table-wrapper teacher-inline-table">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>СТУДЕНТ</th>
                        <th>ЛОГИН</th>
                        <th>МЕД. ГР.</th>
                        <th>ПОСЕЩАЕМОСТЬ</th>
                        <th>ДЕЙСТВИЯ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionStudents.length === 0 ? (
                        <tr className="teacher-placeholder-row">
                          <td colSpan={5}>
                            {sectionLoading ? 'Загрузка…' : 'В секции нет студентов'}
                          </td>
                        </tr>
                      ) : (
                        sectionStudents.map((student) => {
                          const pct = computeAttendanceFromExist(student.exist);
                          return (
                            <tr key={student.id}>
                              <td>
                                <strong>{formatPersonName(student)}</strong>
                              </td>
                              <td>{student.login}</td>
                              <td>{student.healthGroup ?? '—'}</td>
                              <td>
                                <div className="attendance-cell">
                                  <span className="attendance-value">{pct}%</span>
                                  <div className="attendance-bar">
                                    <div
                                      className="attendance-fill"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="teacher-action-link"
                                  onClick={() => {
                                    setHistoryStudentLogin(student.login);
                                    setHistoryLoaded(false);
                                    setAttendanceMap(null);
                                    handleTabChange('history');
                                    loadStudentHistory(student.login);
                                  }}
                                >
                                  История →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  <PanelOverlay show={sectionLoading && sectionStudents.length > 0} />
                </div>
              </div>
            </div>

            <div
              className={`teacher-panel${activeTab === 'attendance' ? ' teacher-panel--active' : ''}`}
            >
              <div className="add-user-panel teacher-panel-body">
                <div className="panel-header">
                  <h2>✅ Отметка посещаемости</h2>
                  <p>
                    {selectedLesson
                      ? `${formatLessonDate(selectedLesson.dateOfLesson)} · ${selectedLesson.startAt}–${selectedLesson.endAt} · ${selectedLesson.disciplineName}`
                      : 'Выберите занятие на вкладке «Мои пары»'}
                  </p>
                </div>

                {!selectedLessonId ? (
                  <p className="teacher-empty-hint">Сначала выберите пару из списка занятий</p>
                ) : (
                  <>
                    <div className="attendance-toolbar">
                      <label className="form-group teacher-lesson-picker">
                        <span>Занятие</span>
                        <select
                          className="form-input"
                          value={selectedLessonId ?? ''}
                          onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                        >
                          {lessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {formatLessonDateShort(l.dateOfLesson)} {l.startAt} —{' '}
                              {l.disciplineName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="submit-btn"
                        disabled={savingAttendance || attendanceLoading}
                        onClick={handleSaveAttendance}
                      >
                        {savingAttendance ? 'Сохранение…' : 'Сохранить посещаемость'}
                      </button>
                    </div>

                    <AttendanceChecklist
                      className="teacher-checklist-shell"
                      rows={attendanceRows}
                      draft={attendanceDraft}
                      loading={attendanceLoading}
                      onToggle={(login, present) =>
                        setAttendanceDraft((prev) => ({ ...prev, [login]: present }))
                      }
                    />
                  </>
                )}
              </div>
            </div>

            <div
              className={`teacher-panel${activeTab === 'history' ? ' teacher-panel--active' : ''}`}
            >
              <div className="add-user-panel teacher-panel-body">
                <div className="panel-header">
                  <h2>📊 История посещаемости студента</h2>
                  <p>Карта посещений по датам занятий</p>
                </div>
                <div className="form-row teacher-history-form">
                  <div className="form-group">
                    <label htmlFor="history-student">Студент</label>
                    <select
                      id="history-student"
                      className="form-input"
                      value={historyStudentLogin}
                      onChange={(e) => {
                        setHistoryStudentLogin(e.target.value);
                        setHistoryLoaded(false);
                      }}
                    >
                      <option value="">— выберите —</option>
                      {studentOptions.map((s) => (
                        <option key={s.login} value={s.login}>
                          {s.name} ({s.login})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group teacher-history-actions">
                    <span className="teacher-field-spacer" aria-hidden="true" />
                    <button
                      type="button"
                      className="search-btn"
                      disabled={historyLoading || !historyStudentLogin}
                      onClick={() => loadStudentHistory(historyStudentLogin)}
                    >
                      {historyLoading ? 'Загрузка…' : 'Показать'}
                    </button>
                  </div>
                </div>

                {historyError ? (
                  <div className="form-alert form-alert--error" role="alert">
                    {historyError}
                  </div>
                ) : null}

                <div className="history-summary-cards teacher-summary-slot">
                  {historyLoaded && attendancePercent != null ? (
                    <div className="stat-card">
                      <div className="stat-card-value">{attendancePercent}%</div>
                      <div className="stat-card-label">ПОСЕЩАЕМОСТЬ</div>
                    </div>
                  ) : (
                    <div className="stat-card stat-card--placeholder" aria-hidden />
                  )}
                  {historyLoaded && totalAbsences != null ? (
                    <div className="stat-card">
                      <div className="stat-card-value">{totalAbsences}</div>
                      <div className="stat-card-label">ПРОПУСКОВ</div>
                    </div>
                  ) : (
                    <div className="stat-card stat-card--placeholder" aria-hidden />
                  )}
                </div>

                <div className="table-wrapper teacher-inline-table teacher-history-table">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>ДАТА</th>
                        <th>ВРЕМЯ</th>
                        <th>СТАТУС</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!historyLoaded ? (
                        <tr className="teacher-placeholder-row">
                          <td colSpan={3}>
                            {historyLoading ? 'Загрузка…' : 'Выберите студента и нажмите «Показать»'}
                          </td>
                        </tr>
                      ) : historyDates.length === 0 ? (
                        <tr className="teacher-placeholder-row">
                          <td colSpan={3}>Нет данных о посещениях</td>
                        </tr>
                      ) : (
                        historyDates.map((dateKey) => {
                          const slots = attendanceMap[dateKey];
                          if (!Array.isArray(slots)) return null;
                          return slots.map((slot, idx) => (
                            <tr key={`${dateKey}-${idx}`}>
                              <td>{formatLessonDate(dateKey)}</td>
                              <td>
                                {slot.startAt || '—'}
                                {slot.endAt ? ` – ${slot.endAt}` : ''}
                              </td>
                              <td>
                                <span
                                  className={`attendance-pill ${
                                    slot.isExists ? 'present' : 'absent'
                                  }`}
                                >
                                  <span className="attendance-pill-text">
                                    {slot.isExists ? 'Был' : 'Нет'}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          ));
                        })
                      )}
                    </tbody>
                  </table>
                  <PanelOverlay show={historyLoading && historyLoaded} />
                </div>
              </div>
            </div>

          </div>
    </CabinetLayout>
  );
};
