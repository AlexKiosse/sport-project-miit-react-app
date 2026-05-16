import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format, isValid, parse } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import {
  studentsApi,
  CreateStudentDuplicateLoginError,
  buildCreateStudentPayload,
  normalizeStudentListResponse,
  formatStudentFullName,
  filterStudentsByLoginSubstring,
} from '/entities/student';
import { FullNameSearchFields } from '/features/full-name-search';
import { LoginSearchField } from '/features/login-search';
import { groupsApi } from '/entities/group';
import {
  healthGroupsApi,
  formatHealthGroupLabel,
  formatHealthGroupValue,
} from '/entities/healthGroup';
import { sectionsApi } from '/entities/section';
import {
  loadAttendancePercentsForStudents,
  getAttendancePercentForStudent,
} from '/shared/lib/attendance/loadAttendancePercentsForStudents';
import { useNavigate } from 'react-router-dom';
import '/shared/ui/cabinet';
import { CabinetLayout } from '/widgets/cabinet-layout';
import { NoticesBar } from '/widgets/notices-bar';
import { useTableSort } from '/shared/lib/sort';
import { SortableTh } from '/shared/ui/sortable-th';

registerLocale('ru', ru);

/** @param {string} str */
function parseBirthdayValue(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = parse(trimmed, 'yyyy-MM-dd', new Date(0));
  return isValid(d) ? d : null;
}

const initialNewStudent = () => ({
  firstName: '',
  lastName: '',
  patronymic: '',
  login: '',
  password: '',
  healthGroupId: '',
  groupId: '',
  birthday: '',
});

const initialSearchForm = () => ({
  mode: 'login',
  login: '',
  firstName: '',
  lastName: '',
  patronymic: '',
  groupId: '',
  sectionId: '',
  healthGroupId: '',
});

function applyLookupDefaultsToSearchForm(prev, groupsList, healthGroupsList, sectionsList) {
  const next = { ...prev };
  if (groupsList.length === 0) {
    next.groupId = '';
  } else if (!groupsList.some((g) => String(g.id) === String(prev.groupId))) {
    next.groupId = String(groupsList[0].id);
  }
  if (sectionsList.length === 0) {
    next.sectionId = '';
  } else if (!sectionsList.some((s) => String(s.id) === String(prev.sectionId))) {
    next.sectionId = String(sectionsList[0].id);
  }
  if (healthGroupsList.length === 0) {
    next.healthGroupId = '';
  } else if (!healthGroupsList.some((h) => String(h.id) === String(prev.healthGroupId))) {
    next.healthGroupId = String(healthGroupsList[0].id);
  }
  return next;
}

export const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [attendanceByLogin, setAttendanceByLogin] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Поиск
  const [searchForm, setSearchForm] = useState(initialSearchForm);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Форма добавления
  const [newStudent, setNewStudent] = useState(initialNewStudent);

  const [createFormError, setCreateFormError] = useState('');
  const [duplicateStudentInfo, setDuplicateStudentInfo] = useState(null);
  const [listNotice, setListNotice] = useState({ variant: '', text: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [groups, setGroups] = useState([]);
  const [healthGroups, setHealthGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [addLookupsLoadState, setAddLookupsLoadState] = useState('idle');
  const [addLookupsError, setAddLookupsError] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentsApi.getAllStudents();
      const list = Array.isArray(data) ? data : [];
      setStudents(list);
      const percents = await loadAttendancePercentsForStudents(list);
      setAttendanceByLogin(percents);
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
      setError('Не удалось загрузить список студентов');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка при открытии страницы и когда вкладка снова становится активной
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchStudents();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchStudents]);

  const fetchLookups = useCallback(async () => {
    setAddLookupsError('');
    setAddLookupsLoadState('loading');
    try {
      const [groupsData, healthData, sectionsData] = await Promise.all([
        groupsApi.getAll(),
        healthGroupsApi.findAll(),
        sectionsApi.getAll(),
      ]);
      const gList = Array.isArray(groupsData) ? groupsData : [];
      const hList = Array.isArray(healthData) ? healthData : [];
      const sList = Array.isArray(sectionsData) ? sectionsData : [];
      setGroups(gList);
      setHealthGroups(hList);
      setSections(sList);
      setNewStudent((prev) => {
        const next = { ...prev };
        if (gList.length === 0) {
          next.groupId = '';
        } else if (!gList.some((g) => String(g.id) === String(prev.groupId))) {
          next.groupId = String(gList[0].id);
        }
        if (hList.length === 0) {
          next.healthGroupId = '';
        } else if (!hList.some((h) => String(h.id) === String(prev.healthGroupId))) {
          next.healthGroupId = hList[0].id;
        }
        return next;
      });
      setSearchForm((prev) => applyLookupDefaultsToSearchForm(prev, gList, hList, sList));
      setAddLookupsLoadState('success');
    } catch (err) {
      console.error('Ошибка загрузки справочников:', err);
      setGroups([]);
      setHealthGroups([]);
      setSections([]);
      setAddLookupsLoadState('error');
      setAddLookupsError(
        'Не удалось загрузить справочники (учебные группы, мед. группы или секции)'
      );
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'add' && activeTab !== 'search') {
      return undefined;
    }
    fetchLookups();
    return undefined;
  }, [activeTab, fetchLookups]);

  useEffect(() => {
    if (activeTab === 'search' && students.length === 0 && !loading) {
      fetchStudents();
    }
  }, [activeTab, students.length, loading, fetchStudents]);

  const handleSearch = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setSearchError('');

    if (searchForm.mode === 'login' && !searchForm.login.trim()) {
      setSearchError('Введите логин.');
      return;
    }
    if (searchForm.mode === 'fullName') {
      if (!searchForm.lastName.trim() || !searchForm.firstName.trim()) {
        setSearchError('Укажите фамилию и имя для поиска по ФИО.');
        return;
      }
    }
    if (searchForm.mode === 'group') {
      if (addLookupsLoadState !== 'success' || groups.length === 0) {
        setSearchError('Справочник учебных групп не загружен.');
        return;
      }
      if (!groups.some((g) => String(g.id) === String(searchForm.groupId))) {
        setSearchError('Выберите учебную группу из списка.');
        return;
      }
    }
    if (searchForm.mode === 'section') {
      if (addLookupsLoadState !== 'success' || sections.length === 0) {
        setSearchError('Справочник секций не загружен.');
        return;
      }
      if (!sections.some((s) => String(s.id) === String(searchForm.sectionId))) {
        setSearchError('Выберите секцию из списка.');
        return;
      }
    }
    if (searchForm.mode === 'healthGroup') {
      if (addLookupsLoadState !== 'success' || healthGroups.length === 0) {
        setSearchError('Справочник медицинских групп не загружен.');
        return;
      }
      if (!healthGroups.some((h) => String(h.id) === String(searchForm.healthGroupId))) {
        setSearchError('Выберите медицинскую группу из списка.');
        return;
      }
    }

    setLoading(true);
    try {
      let data;
      switch (searchForm.mode) {
        case 'login': {
          if (students.length === 0) {
            const all = await studentsApi.getAllStudents();
            const list = Array.isArray(all) ? all : [];
            setStudents(list);
            data = filterStudentsByLoginSubstring(list, searchForm.login);
          } else {
            data = filterStudentsByLoginSubstring(students, searchForm.login);
          }
          break;
        }
        case 'fullName':
          data = await studentsApi.searchByFullName(
            searchForm.firstName.trim(),
            searchForm.lastName.trim(),
            searchForm.patronymic.trim()
          );
          break;
        case 'group':
          data = await studentsApi.getStudentsByGroup(Number(searchForm.groupId));
          break;
        case 'section':
          data = await studentsApi.getStudentsBySection(Number(searchForm.sectionId));
          break;
        case 'healthGroup':
          data = await studentsApi.getStudentsByHealthGroup(Number(searchForm.healthGroupId));
          break;
        case 'all':
          data = await studentsApi.getAllStudents();
          break;
        default:
          data = [];
      }
      const normalized = normalizeStudentListResponse(data);
      setSearchResults(normalized);
      setShowSearchResults(true);
      if (normalized.length > 0) {
        const percents = await loadAttendancePercentsForStudents(normalized);
        setAttendanceByLogin((prev) => ({ ...prev, ...percents }));
      }
    } catch (err) {
      console.error('Ошибка поиска:', err);
      let message = 'Не удалось выполнить поиск.';
      if (err?.response?.data !== undefined) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim()) {
          message = d;
        } else if (d && typeof d === 'object' && typeof d.message === 'string') {
          message = d.message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      setSearchError(message);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setLoading(false);
    }
  };

  const validateCreateStudentForm = () => {
    if (addLookupsLoadState === 'loading') {
      return 'Подождите загрузки справочников.';
    }
    if (addLookupsLoadState === 'error') {
      return 'Справочники не загружены. Нажмите «Повторить загрузку» или откройте вкладку снова.';
    }
    if (addLookupsLoadState === 'success' && groups.length === 0) {
      return 'В системе нет ни одной учебной группы — добавление невозможно.';
    }
    if (addLookupsLoadState === 'success' && healthGroups.length === 0) {
      return 'В системе нет ни одной медицинской группы — добавление невозможно.';
    }
    if (!newStudent.lastName.trim() || !newStudent.firstName.trim()) {
      return 'Укажите фамилию и имя.';
    }
    if (!newStudent.login.trim()) {
      return 'Укажите логин.';
    }
    if (!newStudent.password) {
      return 'Укажите пароль.';
    }
    const groupId = Number(newStudent.groupId);
    if (!Number.isFinite(groupId) || groupId < 1) {
      return 'Выберите учебную группу.';
    }
    if (!groups.some((g) => String(g.id) === String(newStudent.groupId))) {
      return 'Выберите учебную группу из списка.';
    }
    const healthId = Number(newStudent.healthGroupId);
    if (!Number.isFinite(healthId) || healthId < 1) {
      return 'Выберите группу здоровья.';
    }
    if (!healthGroups.some((h) => String(h.id) === String(newStudent.healthGroupId))) {
      return 'Выберите группу здоровья из списка.';
    }
    return '';
  };

  // Добавление студента
  const handleAddStudent = async (e) => {
    e.preventDefault();
    const validationError = validateCreateStudentForm();
    if (validationError) {
      setCreateFormError(validationError);
      setDuplicateStudentInfo(null);
      return;
    }

    setLoading(true);
    setCreateFormError('');
    setDuplicateStudentInfo(null);

    const payload = buildCreateStudentPayload(newStudent);

    try {
      const created = await studentsApi.createStudent(payload);
      const successText = `Студент создан: ${created.lastName} ${created.firstName} ${created.patronymic || ''} · логин ${created.login} · группа ${created.groupName ?? '—'} · зд. гр. ${created.healthGroup}`;
      setListNotice({ variant: 'success', text: successText });
      setNewStudent(() => ({
        ...initialNewStudent(),
        groupId: groups.length ? String(groups[0].id) : '',
        healthGroupId: healthGroups.length ? healthGroups[0].id : '',
      }));
      await fetchStudents();
      setActiveTab('students');
    } catch (err) {
      console.error('Ошибка добавления:', err);
      if (err instanceof CreateStudentDuplicateLoginError) {
        setCreateFormError(err.message);
        setDuplicateStudentInfo(err.existingStudent);
        return;
      }
      let message = 'Не удалось создать студента.';
      if (err?.response?.data !== undefined) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim()) {
          message = d;
        } else if (d && typeof d === 'object' && typeof d.message === 'string') {
          message = d.message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      setCreateFormError(message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление студента
  const handleDeleteStudent = async (id, login) => {
    if (window.confirm('Удалить студента?')) {
      setLoading(true);
      try {
        await studentsApi.deleteStudentById(id);
        fetchStudents();
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Ошибка при удалении');
      } finally {
        setLoading(false);
      }
    }
  };

  const listSort = useTableSort('name', 'asc');
  const searchSort = useTableSort('name', 'asc');

  const displayStudents = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        name: formatStudentFullName(student),
        studentId: student.login,
        attendance: getAttendancePercentForStudent(student, attendanceByLogin),
      })),
    [students, attendanceByLogin]
  );

  const sortedDisplayStudents = useMemo(
    () =>
      listSort.sortItems(displayStudents, {
        name: (s) => `${s.name}|${s.studentId}`,
        attendance: (s) => s.attendance,
      }),
    [displayStudents, listSort]
  );

  const sortedSearchResults = useMemo(
    () =>
      searchSort.sortItems(searchResults, {
        name: formatStudentFullName,
        login: (s) => s.login ?? '',
        groupName: (s) => (s.groupName != null && s.groupName !== '' ? s.groupName : ''),
        healthGroup: (s) => (typeof s.healthGroup === 'number' ? s.healthGroup : -1),
        attendance: (s) => getAttendancePercentForStudent(s, attendanceByLogin),
      }),
    [searchResults, searchSort, attendanceByLogin]
  );

  return (
    <CabinetLayout
      badge="АДМИН ПАНЕЛЬ"
      rightContent={
        <button type="button" className="logout-btn" onClick={() => navigate('/')}>
          Выйти
        </button>
      }
      sidebar={
        <>
          <div className="sidebar-section">
            <h3>Управление</h3>
            <button 
              className={`sidebar-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              📋 Список студентов
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('add');
                setShowSearchResults(false);
                setCreateFormError('');
                setDuplicateStudentInfo(null);
              }}
            >
              ➕ Добавить пользователя
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('search');
                setShowSearchResults(false);
                setSearchResults([]);
                setSearchForm(initialSearchForm());
                setSearchError('');
              }}
            >
              🔍 Найти пользователя
            </button>
          </div>

        </>
      }
    >
          {/* Вкладка: СПИСОК СТУДЕНТОВ */}
          {activeTab === 'students' && (
            <>
              <NoticesBar
                error={error}
                notice={listNotice}
                onDismissError={() => setError('')}
                onDismissNotice={() => setListNotice({ variant: '', text: '' })}
              />
              <div className="table-wrapper">
                <div className="table-header table-header--with-action">
                  <p className="subtitle">Список студентов</p>
                  <button
                    type="button"
                    className="admin-refresh-btn"
                    onClick={() => fetchStudents()}
                    disabled={loading}
                    title="Подтянуть актуальную посещаемость с сервера"
                  >
                    {loading ? 'Обновление…' : '↻ Обновить'}
                  </button>
                </div>

                <table className="students-table">
                  <thead>
                    <tr>
                      <SortableTh
                        label="СТУДЕНТ"
                        columnKey="name"
                        sortKey={listSort.sortKey}
                        sortDirection={listSort.sortDirection}
                        onSort={listSort.toggleSort}
                      />
                      <SortableTh
                        label="ПОСЕЩАЕМОСТЬ"
                        columnKey="attendance"
                        sortKey={listSort.sortKey}
                        sortDirection={listSort.sortDirection}
                        onSort={listSort.toggleSort}
                      />
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDisplayStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="student-info">
                            <strong>{student.name}</strong>
                            <span className="student-id">ID: {student.studentId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="attendance-cell">
                            <span className="attendance-value">{student.attendance}%</span>
                            <div className="attendance-bar">
                              <div className="attendance-fill" style={{ width: `${student.attendance}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button className="action-btn edit">✏️</button>
                          <button className="action-btn delete" onClick={() => handleDeleteStudent(student.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </>
          )}

          {/* Вкладка: ДОБАВИТЬ ПОЛЬЗОВАТЕЛЯ */}
          {activeTab === 'add' && (
            <div className="add-user-panel">
              <div className="panel-header">
                <h2>➕ Добавление нового пользователя</h2>
              </div>
              <div className="add-user-form">
                {addLookupsLoadState === 'error' ? (
                  <div className="form-alert form-alert--error form-alert--stack groups-load-error" role="alert">
                    <div>{addLookupsError}</div>
                    <button type="button" className="retry-groups-btn" onClick={() => fetchLookups()}>
                      Повторить загрузку
                    </button>
                  </div>
                ) : null}

                <form onSubmit={handleAddStudent}>
                  {createFormError ? (
                    <div className="form-alert form-alert--error form-alert--stack" role="alert">
                      <div className="form-alert-body">{createFormError}</div>
                      {duplicateStudentInfo ? (
                        <div className="form-alert__detail">
                          Уже существует:{' '}
                          <strong>
                            {duplicateStudentInfo.lastName} {duplicateStudentInfo.firstName}{' '}
                            {duplicateStudentInfo.patronymic || ''}
                          </strong>
                          , логин <span className="mono">{duplicateStudentInfo.login}</span>
                          {duplicateStudentInfo.groupName != null && duplicateStudentInfo.groupName !== ''
                            ? `, учебная группа «${duplicateStudentInfo.groupName}»`
                            : ''}
                          {typeof duplicateStudentInfo.healthGroup === 'number'
                            ? `, группа здоровья ${duplicateStudentInfo.healthGroup}`
                            : ''}
                          .
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="form-row form-row--triple">
                    <div className="form-group">
                      <label htmlFor="student-last-name">Фамилия</label>
                      <input
                        id="student-last-name"
                        type="text"
                        className="form-input"
                        autoComplete="family-name"
                        placeholder="Иванов"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="student-first-name">Имя</label>
                      <input
                        id="student-first-name"
                        type="text"
                        className="form-input"
                        autoComplete="given-name"
                        placeholder="Иван"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="student-patronymic">Отчество</label>
                      <input
                        id="student-patronymic"
                        type="text"
                        className="form-input"
                        placeholder="Иванович"
                        value={newStudent.patronymic}
                        onChange={(e) => setNewStudent({ ...newStudent, patronymic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="student-login">Логин</label>
                      <input
                        id="student-login"
                        type="text"
                        className="form-input"
                        autoComplete="username"
                        placeholder="ivanov"
                        value={newStudent.login}
                        onChange={(e) => setNewStudent({ ...newStudent, login: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="student-password">Пароль</label>
                      <div className="password-input-wrap">
                        <input
                          id="student-password"
                          type={passwordVisible ? 'text' : 'password'}
                          className="form-input password-input"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={newStudent.password}
                          onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="password-visibility-btn"
                          aria-pressed={passwordVisible}
                          aria-label={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                          onClick={() => setPasswordVisible((v) => !v)}
                        >
                          {passwordVisible ? 'Скрыть' : 'Показать'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="student-health-group">Группа здоровья</label>
                      <select
                        id="student-health-group"
                        className="form-input"
                        value={newStudent.healthGroupId === '' ? '' : newStudent.healthGroupId}
                        disabled={addLookupsLoadState !== 'success' || healthGroups.length === 0}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            healthGroupId:
                              e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                      >
                        {healthGroups.length === 0 ? (
                          <option value="">Нет мед. групп</option>
                        ) : (
                          healthGroups.map((hg) => (
                            <option key={hg.id} value={hg.id}>
                              {formatHealthGroupLabel(hg)}
                            </option>
                          ))
                        )}
                      </select>
                      {addLookupsLoadState === 'success' && healthGroups.length === 0 ? (
                        <p className="form-hint">Сервер вернул пустой список медицинских групп.</p>
                      ) : null}
                    </div>
                    <div className="form-group">
                      <label htmlFor="student-group-select">Учебная группа</label>
                      <select
                        id="student-group-select"
                        className="form-input"
                        value={newStudent.groupId}
                        disabled={addLookupsLoadState !== 'success' || groups.length === 0}
                        onChange={(e) => setNewStudent({ ...newStudent, groupId: e.target.value })}
                      >
                        {groups.length === 0 ? (
                          <option value="">Нет групп</option>
                        ) : (
                          groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.institute != null && String(g.institute).trim() !== ''
                                ? `${g.name} (${g.institute})`
                                : g.name}
                            </option>
                          ))
                        )}
                      </select>
                      {addLookupsLoadState === 'success' && groups.length === 0 ? (
                        <p className="form-hint">Сервер вернул пустой список групп.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="student-birthday">Дата рождения</label>
                      <DatePicker
                        id="student-birthday"
                        selected={parseBirthdayValue(newStudent.birthday)}
                        onChange={(date) =>
                          setNewStudent({
                            ...newStudent,
                            birthday: date && isValid(date) ? format(date, 'yyyy-MM-dd') : '',
                          })
                        }
                        locale="ru"
                        dateFormat="dd.MM.yyyy"
                        placeholderText="Выберите дату"
                        className="form-input datepicker-input"
                        wrapperClassName="datepicker-field-wrap"
                        calendarClassName="admin-datepicker-calendar"
                        popperClassName="admin-datepicker-popper"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={100}
                        scrollableYearDropdown
                        isClearable
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-buttons">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={
                        loading ||
                        addLookupsLoadState !== 'success' ||
                        groups.length === 0 ||
                        healthGroups.length === 0
                      }
                    >
                      {loading ? 'Добавление...' : '➕ Добавить'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setActiveTab('students');
                        setCreateFormError('');
                        setDuplicateStudentInfo(null);
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
              {addLookupsLoadState === 'loading' ? (
                <div className="add-user-loading-overlay" aria-busy="true" aria-live="polite">
                  <div className="spinner-circle" aria-hidden />
                  <p>Загрузка справочников…</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Вкладка: НАЙТИ ПОЛЬЗОВАТЕЛЯ */}
          {activeTab === 'search' && (
            <div className="search-panel">
              <div className="panel-header">
                <h2>🔍 Поиск студентов</h2>
                <p>Выберите тип поиска и заполните поля.</p>
              </div>

              <form className="search-form search-form-extended" onSubmit={handleSearch}>
                {addLookupsLoadState === 'error' ? (
                  <div className="form-alert form-alert--error form-alert--stack" role="alert">
                    <div>{addLookupsError}</div>
                    <button type="button" className="retry-groups-btn" onClick={() => fetchLookups()}>
                      Повторить загрузку
                    </button>
                  </div>
                ) : null}

                <div className="form-group search-mode-group">
                  <label htmlFor="search-mode">Тип поиска</label>
                  <select
                    id="search-mode"
                    className="form-input"
                    value={searchForm.mode}
                    onChange={(e) => {
                      setSearchForm(
                        applyLookupDefaultsToSearchForm(
                          { ...initialSearchForm(), mode: e.target.value },
                          groups,
                          healthGroups,
                          sections
                        )
                      );
                      setSearchError('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                  >
                    <option value="login">По логину</option>
                    <option value="fullName">По ФИО</option>
                    <option value="group">По учебной группе</option>
                    <option value="section">По секции</option>
                    <option value="healthGroup">По медицинской группе</option>
                    <option value="all">Все студенты</option>
                  </select>
                </div>

                {searchForm.mode === 'login' && (
                  <LoginSearchField
                    login={searchForm.login}
                    students={students}
                    studentsLoading={loading && students.length === 0}
                    onChange={(value) => setSearchForm((prev) => ({ ...prev, login: value }))}
                  />
                )}

                {searchForm.mode === 'fullName' && (
                  <FullNameSearchFields
                    lastName={searchForm.lastName}
                    firstName={searchForm.firstName}
                    patronymic={searchForm.patronymic}
                    students={students}
                    studentsLoading={loading && students.length === 0}
                    onChange={(patch) => setSearchForm((prev) => ({ ...prev, ...patch }))}
                  />
                )}

                {searchForm.mode === 'group' && (
                  <div className="form-group">
                    <label htmlFor="search-group-select">Учебная группа</label>
                    <select
                      id="search-group-select"
                      className="form-input"
                      value={searchForm.groupId}
                      disabled={addLookupsLoadState !== 'success' || groups.length === 0}
                      onChange={(e) => setSearchForm({ ...searchForm, groupId: e.target.value })}
                    >
                      {groups.length === 0 ? (
                        <option value="">
                          {addLookupsLoadState === 'loading' ? 'Загрузка…' : 'Нет групп'}
                        </option>
                      ) : (
                        groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.institute != null && String(g.institute).trim() !== ''
                              ? `${g.name} (${g.institute})`
                              : g.name}
                          </option>
                        ))
                      )}
                    </select>
                    {addLookupsLoadState === 'success' && groups.length === 0 ? (
                      <p className="form-hint">Сервер вернул пустой список учебных групп.</p>
                    ) : null}
                  </div>
                )}

                {searchForm.mode === 'section' && (
                  <div className="form-group">
                    <label htmlFor="search-section-select">Секция</label>
                    <select
                      id="search-section-select"
                      className="form-input"
                      value={searchForm.sectionId}
                      disabled={addLookupsLoadState !== 'success' || sections.length === 0}
                      onChange={(e) => setSearchForm({ ...searchForm, sectionId: e.target.value })}
                    >
                      {sections.length === 0 ? (
                        <option value="">
                          {addLookupsLoadState === 'loading' ? 'Загрузка…' : 'Нет секций'}
                        </option>
                      ) : (
                        sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      )}
                    </select>
                    {addLookupsLoadState === 'success' && sections.length === 0 ? (
                      <p className="form-hint">Сервер вернул пустой список секций.</p>
                    ) : null}
                  </div>
                )}

                {searchForm.mode === 'healthGroup' && (
                  <div className="form-group">
                    <label htmlFor="search-health-group">Группа здоровья</label>
                    <select
                      id="search-health-group"
                      className="form-input"
                      value={searchForm.healthGroupId === '' ? '' : searchForm.healthGroupId}
                      disabled={addLookupsLoadState !== 'success' || healthGroups.length === 0}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          healthGroupId: e.target.value === '' ? '' : e.target.value,
                        })
                      }
                    >
                      {healthGroups.length === 0 ? (
                        <option value="">
                          {addLookupsLoadState === 'loading' ? 'Загрузка…' : 'Нет мед. групп'}
                        </option>
                      ) : (
                        healthGroups.map((hg) => (
                          <option key={hg.id} value={hg.id}>
                            {formatHealthGroupLabel(hg)}
                          </option>
                        ))
                      )}
                    </select>
                    {addLookupsLoadState === 'success' && healthGroups.length === 0 ? (
                      <p className="form-hint">Сервер вернул пустой список медицинских групп.</p>
                    ) : null}
                  </div>
                )}

                {searchError ? (
                  <div className="form-alert form-alert--error form-alert--stack search-error" role="alert">
                    {searchError}
                  </div>
                ) : null}

                <div className="search-actions">
                  <button
                    type="submit"
                    className="search-btn"
                    disabled={
                      loading ||
                      (searchForm.mode === 'group' &&
                        (addLookupsLoadState !== 'success' || groups.length === 0)) ||
                      (searchForm.mode === 'section' &&
                        (addLookupsLoadState !== 'success' || sections.length === 0)) ||
                      (searchForm.mode === 'healthGroup' &&
                        (addLookupsLoadState !== 'success' || healthGroups.length === 0))
                    }
                  >
                    {loading ? 'Поиск...' : searchForm.mode === 'all' ? 'Загрузить всех' : 'Найти'}
                  </button>
                </div>
              </form>

              {showSearchResults && (
                <div className="search-results">
                  <h3>Результаты{searchResults.length ? ` (${searchResults.length})` : ''}</h3>
                  {searchResults.length > 0 ? (
                    <div className="results-table-container">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <SortableTh
                              label="Студент"
                              columnKey="name"
                              sortKey={searchSort.sortKey}
                              sortDirection={searchSort.sortDirection}
                              onSort={searchSort.toggleSort}
                            />
                            <SortableTh
                              label="Логин"
                              columnKey="login"
                              sortKey={searchSort.sortKey}
                              sortDirection={searchSort.sortDirection}
                              onSort={searchSort.toggleSort}
                            />
                            <SortableTh
                              label="Группа"
                              columnKey="groupName"
                              sortKey={searchSort.sortKey}
                              sortDirection={searchSort.sortDirection}
                              onSort={searchSort.toggleSort}
                            />
                            <SortableTh
                              label="Мед. гр."
                              columnKey="healthGroup"
                              sortKey={searchSort.sortKey}
                              sortDirection={searchSort.sortDirection}
                              onSort={searchSort.toggleSort}
                            />
                            <SortableTh
                              label="Посещаемость"
                              columnKey="attendance"
                              sortKey={searchSort.sortKey}
                              sortDirection={searchSort.sortDirection}
                              onSort={searchSort.toggleSort}
                            />
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSearchResults.map((student) => (
                            <tr key={`${student.id}-${student.login}`}>
                              <td>
                                <strong>{formatStudentFullName(student)}</strong>
                              </td>
                              <td>{student.login}</td>
                              <td>{student.groupName != null && student.groupName !== '' ? student.groupName : '—'}</td>
                              <td>{formatHealthGroupValue(student.healthGroup, healthGroups)}</td>
                              <td>
                                {getAttendancePercentForStudent(student, attendanceByLogin)}%
                              </td>
                              <td>
                                <button type="button" className="action-btn edit" aria-label="Редактировать">
                                  ✏️
                                </button>
                                <button type="button" className="action-btn delete" aria-label="Удалить">
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-results">
                      <p>Ничего не найдено</p>
                      <small>Измените запрос или тип поиска и попробуйте снова</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

    </CabinetLayout>
  );
};