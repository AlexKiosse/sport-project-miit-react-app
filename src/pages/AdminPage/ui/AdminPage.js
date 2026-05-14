// src/pages/AdminPage/ui/AdminPage.js
import React, { useState, useEffect } from 'react';
import { studentsApi } from '../../../features/students/api/studentsApi';
import './AdminPage.css';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Форма добавления
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    patronymic: '',
    login: '',
    password: '',
    healthGroupId: 1,
    groupId: 1,
    birthday: ''
  });

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

  // Поиск студентов
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      // Пробуем найти по логину
      if (!searchQuery.includes(' ')) {
        try {
          const result = await studentsApi.getStudentByLogin(searchQuery);
          setSearchResults(result ? [result] : []);
        } catch {
          setSearchResults([]);
        }
      } else {
        // Поиск по ФИО
        const parts = searchQuery.trim().split(' ');
        const firstName = parts[1] || '';
        const lastName = parts[0] || '';
        const patronymic = parts[2] || '';
        const results = await studentsApi.searchByFullName(firstName, lastName, patronymic);
        setSearchResults(results);
      }
      setShowSearchResults(true);
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setLoading(false);
    }
  };

  // Добавление студента
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentsApi.createStudent({
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        patronymic: newStudent.patronymic,
        login: newStudent.login,
        password: newStudent.password,
        healthGroupId: newStudent.healthGroupId,
        groupId: newStudent.groupId,
        birthday: newStudent.birthday || null
      });
      alert('Студент успешно добавлен');
      setNewStudent({
        firstName: '', lastName: '', patronymic: '', login: '', password: '',
        healthGroupId: 1, groupId: 1, birthday: ''
      });
      fetchStudents();
      setActiveTab('students');
    } catch (err) {
      console.error('Ошибка добавления:', err);
      alert('Ошибка при добавлении студента');
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
  const displayStudents = students.map(student => ({
    id: student.id,
    name: `${student.lastName} ${student.firstName} ${student.patronymic || ''}`,
    studentId: student.login,
    attendance: 0, // данные с бэка пока нет
    lastClass: '—',
    status: 'АКТИВЕН'
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
          <div className="nav-center">
            <button 
              className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Группа Б-102
            </button>
          </div>
          <div className="nav-right">
            <button className="logout-btn">Выйти</button>
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
                setSearchQuery('');
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
              <div className="table-wrapper">
                <div className="table-header">
                  <h2>Группа Б-102</h2>
                  <p className="subtitle">Список группы | КАФЕДРА ФИЗИЧЕСКОЙ КУЛЬТУРЫ</p>
                </div>

                <table className="students-table">
                  <thead>
                    <tr>
                      <th>СТУДЕНТ</th>
                      <th>ПОСЕЩАЕМОСТЬ</th>
                      <th>ПОСЛЕДНЕЕ ЗАНЯТИЕ</th>
                      <th>СТАТУС</th>
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
                        <td>{student.lastClass}</td>
                        <td><span className="status active">{student.status}</span></td>
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
                <p>Заполните форму для добавления студента в систему</p>
              </div>
              <div className="add-user-form">
                <form onSubmit={handleAddStudent}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>ФИО студента</label>
                      <input type="text" className="form-input" placeholder="Иванов Иван Иванович" value={newStudent.lastName} onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>ID студента (логин)</label>
                      <input type="text" className="form-input" placeholder="2024-0000" value={newStudent.login} onChange={(e) => setNewStudent({...newStudent, login: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Группа</label>
                      <input type="text" className="form-input" placeholder="Б-102" value={newStudent.groupId} onChange={(e) => setNewStudent({...newStudent, groupId: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" className="form-input" placeholder="student@miit.ru" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Телефон</label>
                      <input type="tel" className="form-input" placeholder="+7 XXX XXX XX XX" />
                    </div>
                    <div className="form-group">
                      <label>Дата рождения</label>
                      <input type="date" className="form-input" value={newStudent.birthday} onChange={(e) => setNewStudent({...newStudent, birthday: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Добавление...' : '➕ Добавить'}</button>
                    <button type="button" className="cancel-btn" onClick={() => setActiveTab('students')}>Отмена</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Вкладка: НАЙТИ ПОЛЬЗОВАТЕЛЯ */}
          {activeTab === 'search' && (
            <div className="search-panel">
              <div className="panel-header">
                <h2>🔍 Поиск пользователя</h2>
                <p>Введите имя и фамилию или номер студенческого для поиска</p>
              </div>
              <div className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-btn" onClick={handleSearch} disabled={loading}>{loading ? 'Поиск...' : 'Найти'}</button>
                </div>
              </div>

              {/* Результаты поиска */}
              {showSearchResults && (
                <div className="search-results">
                  <h3>Результаты поиска:</h3>
                  {searchResults.length > 0 ? (
                    <div className="results-table-container">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Студент</th>
                            <th>ID</th>
                            <th>Посещаемость</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map(student => (
                            <tr key={student.id}>
                              <td><strong>{student.lastName} {student.firstName} {student.patronymic || ''}</strong></td>
                              <td>{student.login}</td>
                              <td>—</td>
                              <td><span className="status active">АКТИВЕН</span></td>
                              <td>
                                <button className="action-btn edit">✏️</button>
                                <button className="action-btn delete">🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-results">
                      <p>❌ Ничего не найдено</p>
                      <small>Попробуйте другой поисковый запрос</small>
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