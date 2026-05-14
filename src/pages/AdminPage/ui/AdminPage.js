import React, { useState, useEffect, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format, isValid, parse } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import {
  studentsApi,
  CreateStudentDuplicateLoginError,
  buildCreateStudentPayload,
  normalizeStudentListResponse,
  computeAttendanceFromExist,
} from '../../../entities/student';
import { groupsApi } from '../../../entities/group';
import { healthGroupsApi } from '../../../entities/healthGroup';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

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
  healthGroupId: 1,
});

export const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
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
  const [addLookupsLoadState, setAddLookupsLoadState] = useState('idle');
  const [addLookupsError, setAddLookupsError] = useState('');

  // Статистика
  const [statistics, setStatistics] = useState({
    averageAttendance: '',
    totalStudents: '',
    totalClasses: '',
    bestStudent: { name: '', attendance: '' }
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchAddFormLookups = useCallback(async () => {
    setAddLookupsError('');
    setAddLookupsLoadState('loading');
    try {
      const [groupsData, healthData] = await Promise.all([
        groupsApi.getAll(),
        healthGroupsApi.findAll(),
      ]);
      const gList = Array.isArray(groupsData) ? groupsData : [];
      const hList = Array.isArray(healthData) ? healthData : [];
      setGroups(gList);
      setHealthGroups(hList);
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
      setAddLookupsLoadState('success');
    } catch (err) {
      console.error('Ошибка загрузки справочников:', err);
      setGroups([]);
      setHealthGroups([]);
      setAddLookupsLoadState('error');
      setAddLookupsError('Не удалось загрузить справочники (учебные группы или мед. группы)');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'add') {
      return undefined;
    }
    fetchAddFormLookups();
    return undefined;
  }, [activeTab, fetchAddFormLookups]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentsApi.getAllStudents();
      setStudents(data);
      setStatistics(prev => ({
        ...prev,
        totalStudents: data.length
      }));
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
      setError('Не удалось загрузить список студентов');
    } finally {
      setLoading(false);
    }
  };

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
      const gid = Number(searchForm.groupId);
      if (!Number.isFinite(gid) || gid < 1) {
        setSearchError('Укажите корректный числовой ID группы (group-id).');
        return;
      }
    }
    if (searchForm.mode === 'section') {
      const sid = Number(searchForm.sectionId);
      if (!Number.isFinite(sid) || sid < 1) {
        setSearchError('Укажите корректный числовой ID секции (section-id).');
        return;
      }
    }

    setLoading(true);
    try {
      let data;
      switch (searchForm.mode) {
        case 'login': {
          try {
            data = await studentsApi.getStudentByLogin(searchForm.login.trim());
          } catch {
            data = null;
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
      setSearchResults(normalizeStudentListResponse(data));
      setShowSearchResults(true);
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

  // Для отображения в таблице (адаптация данных из бэка)
  const displayStudents = students.map((student) => ({
    id: student.id,
    name: `${student.lastName} ${student.firstName} ${student.patronymic || ''}`,
    studentId: student.login,
    attendance: computeAttendanceFromExist(student.exist),
  }));

  return (
    <div className="admin-page">
      {/* Навигация*/}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <h1 className="logo">РУТ <span>СПОРТ</span></h1>
            <span className="admin-badge">АДМИН ПАНЕЛЬ</span>
          </div>
          <div className="nav-right">
            <button
              type="button"
              className="logout-btn"
              onClick={() => navigate('/')}
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      {/* Основной контент с синей боковой панелью */}
      <div className="admin-container">
        {/* СИНЯЯ БОКОВАЯ ПАНЕЛЬ - СПРАВА ОТ НЕЁ ОСНОВНОЙ КОНТЕНТ */}
        <aside className="admin-sidebar">
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

          <div className="sidebar-section">
            <h3>Статистика</h3>
            <div className="stat-item">
              <span>Средняя посещаемость</span>
              <strong>{statistics.averageAttendance}%</strong>
            </div>
            <div className="stat-item">
              <span>Занятий проведено</span>
              <strong>{statistics.totalClasses}</strong>
            </div>
            <div className="stat-item">
              <span>Лучший студент</span>
              <strong>{statistics.bestStudent.name}</strong>
              <small>{statistics.bestStudent.attendance}% посещаемость</small>
            </div>
          </div>
        </aside>

        {/* ОСНОВНАЯ ОБЛАСТЬ - меняется в зависимости от выбранной кнопки */}
        <main className="admin-main">
          
          {/* Вкладка: СПИСОК СТУДЕНТОВ */}
          {activeTab === 'students' && (
            <>
              {(error || listNotice.text) && (
                <div className="admin-notices">
                  {error ? (
                    <div className="form-alert form-alert--error" role="alert">
                      <span className="form-alert-text">{error}</span>
                      <button type="button" className="form-alert-dismiss" onClick={() => setError('')} aria-label="Закрыть">×</button>
                    </div>
                  ) : null}
                  {listNotice.text ? (
                    <div className={`form-alert form-alert--${listNotice.variant}`} role="status">
                      <span className="form-alert-text">{listNotice.text}</span>
                      <button type="button" className="form-alert-dismiss" onClick={() => setListNotice({ variant: '', text: '' })} aria-label="Закрыть">×</button>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="table-wrapper">
                <div className="table-header">
                  <p className="subtitle">Список студентов | КАФЕДРА ФИЗИЧЕСКОЙ КУЛЬТУРЫ</p>
                </div>

                <table className="students-table">
                  <thead>
                    <tr>
                      <th>СТУДЕНТ</th>
                      <th>ПОСЕЩАЕМОСТЬ</th>
                      <th>ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStudents.map((student) => (
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

              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-card-value">{statistics.averageAttendance}%</div>
                  <div className="stat-card-label">СРЕДНЯЯ ПОСЕЩАЕМОСТЬ</div>
                  <div className="stat-card-change">+2.4% с прошлого месяца</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statistics.totalClasses}</div>
                  <div className="stat-card-label">ЗАНЯТИЙ ПРОВЕДЕНО</div>
                  <div className="stat-card-change">Всего в семестре: 48</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{statistics.bestStudent.attendance}%</div>
                  <div className="stat-card-label">ЛУЧШИЙ СТУДЕНТ</div>
                  <div className="stat-card-change">{statistics.bestStudent.name}</div>
                </div>
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
                    <button type="button" className="retry-groups-btn" onClick={() => fetchAddFormLookups()}>
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
                              {hg.description != null && String(hg.description).trim() !== ''
                                ? hg.description
                                : `Группа ${hg.name ?? hg.id}`}
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
                <p>Выберите тип поиска и заполните поля — запросы уходят на соответствующие эндпоинты API.</p>
              </div>

              <form className="search-form search-form-extended" onSubmit={handleSearch}>
                <div className="form-group search-mode-group">
                  <label htmlFor="search-mode">Тип поиска</label>
                  <select
                    id="search-mode"
                    className="form-input"
                    value={searchForm.mode}
                    onChange={(e) => {
                      setSearchForm({ ...initialSearchForm(), mode: e.target.value });
                      setSearchError('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                  >
                    <option value="login">По логину</option>
                    <option value="fullName">По ФИО</option>
                    <option value="group">По ID учебной группы</option>
                    <option value="section">По ID секции</option>
                    <option value="healthGroup">По медицинской группе</option>
                    <option value="all">Все студенты (find-all)</option>
                  </select>
                </div>

                {searchForm.mode === 'login' && (
                  <div className="form-group">
                    <label htmlFor="search-login">Логин</label>
                    <input
                      id="search-login"
                      type="text"
                      className="form-input"
                      placeholder="ivanov"
                      autoComplete="off"
                      value={searchForm.login}
                      onChange={(e) => setSearchForm({ ...searchForm, login: e.target.value })}
                    />
                  </div>
                )}

                {searchForm.mode === 'fullName' && (
                  <div className="form-row form-row--triple search-name-row">
                    <div className="form-group">
                      <label htmlFor="search-last-name">Фамилия</label>
                      <input
                        id="search-last-name"
                        type="text"
                        className="form-input"
                        placeholder="Иванов"
                        value={searchForm.lastName}
                        onChange={(e) => setSearchForm({ ...searchForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="search-first-name">Имя</label>
                      <input
                        id="search-first-name"
                        type="text"
                        className="form-input"
                        placeholder="Иван"
                        value={searchForm.firstName}
                        onChange={(e) => setSearchForm({ ...searchForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="search-patronymic">Отчество</label>
                      <input
                        id="search-patronymic"
                        type="text"
                        className="form-input"
                        placeholder="Иванович (необязательно)"
                        value={searchForm.patronymic}
                        onChange={(e) => setSearchForm({ ...searchForm, patronymic: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {searchForm.mode === 'group' && (
                  <div className="form-group">
                    <label htmlFor="search-group-id">ID группы (group-id)</label>
                    <input
                      id="search-group-id"
                      type="number"
                      min={1}
                      step={1}
                      className="form-input"
                      placeholder="1"
                      value={searchForm.groupId}
                      onChange={(e) => setSearchForm({ ...searchForm, groupId: e.target.value })}
                    />
                  </div>
                )}

                {searchForm.mode === 'section' && (
                  <div className="form-group">
                    <label htmlFor="search-section-id">ID секции (section-id)</label>
                    <input
                      id="search-section-id"
                      type="number"
                      min={1}
                      step={1}
                      className="form-input"
                      placeholder="1"
                      value={searchForm.sectionId}
                      onChange={(e) => setSearchForm({ ...searchForm, sectionId: e.target.value })}
                    />
                  </div>
                )}

                {searchForm.mode === 'healthGroup' && (
                  <div className="form-group">
                    <label htmlFor="search-health-group">Медицинская группа</label>
                    <select
                      id="search-health-group"
                      className="form-input"
                      value={searchForm.healthGroupId}
                      onChange={(e) =>
                        setSearchForm({ ...searchForm, healthGroupId: Number(e.target.value) })
                      }
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                )}

                {searchForm.mode === 'all' && (
                  <p className="form-hint search-all-hint">
                    Загрузит полный список через <span className="mono">GET /api/students/find-all</span> (как на
                    вкладке «Список студентов», но результат показывается здесь).
                  </p>
                )}

                {searchError ? (
                  <div className="form-alert form-alert--error form-alert--stack search-error" role="alert">
                    {searchError}
                  </div>
                ) : null}

                <div className="search-actions">
                  <button type="submit" className="search-btn" disabled={loading}>
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
                            <th>Студент</th>
                            <th>Логин</th>
                            <th>Группа</th>
                            <th>Мед. гр.</th>
                            <th>Посещаемость</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((student) => (
                            <tr key={`${student.id}-${student.login}`}>
                              <td>
                                <strong>
                                  {student.lastName} {student.firstName} {student.patronymic || ''}
                                </strong>
                              </td>
                              <td>{student.login}</td>
                              <td>{student.groupName != null && student.groupName !== '' ? student.groupName : '—'}</td>
                              <td>{typeof student.healthGroup === 'number' ? student.healthGroup : '—'}</td>
                              <td>{computeAttendanceFromExist(student.exist)}%</td>
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

        </main>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">РУТ СПОРТ</div>
          <p>© 2024 РУТ (МИИТ) Спортивный отдел</p>
          <div className="footer-links">
            <a href="#">Контакты</a>
            <a href="#">О портале</a>
            <a href="#">Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </div>
  );
};