import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import loginImage from '/shared/images/Miit.jpg';
import { authApi } from '/entities/auth';
import { setTeacherSession } from '/shared/lib/session/teacherSession';
import { setStudentSession } from '/shared/lib/session/studentSession';

const MOCK_ADMIN_LOGIN = 'admin';
const MOCK_ADMIN_PASSWORD = 'admin';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setPasswordError('');

    const trimmedLogin = login.trim();

    if (!trimmedLogin) {
      setLoginError('Введите логин');
      return;
    }

    if (!password) {
      setPasswordError('Введите пароль');
      return;
    }

    if (trimmedLogin === MOCK_ADMIN_LOGIN) {
      if (password !== MOCK_ADMIN_PASSWORD) {
        setPasswordError('Неверный пароль');
        return;
      }
      navigate('/admin');
      return;
    }

    setSubmitting(true);
    try {
      const user = await authApi.login(trimmedLogin, password);
      if (user.role === 'student') {
        setStudentSession(user);
        navigate('/student');
        return;
      }
      if (user.role === 'teacher' || user.role === 'moderator') {
        setTeacherSession(user);
        navigate('/teacher');
        return;
      }
      setLoginError('Неизвестная роль пользователя');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setPasswordError(message || 'Неверный логин или пароль');
      } else {
        setLoginError(message || 'Не удалось войти. Проверьте, что API запущен.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <div className="grid-container">
        <div className="left-panel">
          <img src={loginImage} alt="Все на спорт" />
          <div className="image-overlay">
            <div className="image-content">
              <p className="image-text">
                Единая платформа для отслеживания спортивных успехов студентов
              </p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="login-card">
            <button
              type="button"
              className="login-back-btn"
              onClick={() => navigate('/')}
              aria-label="На главную"
              title="На главную"
            >
              ←
            </button>

            <h1 className="main-title">
              Все на спорт
              <br />
            </h1>

            <hr className="divider" />

            <h2 className="login-heading">Вход в систему</h2>
            <p className="login-subtitle">Используйте учетную запись портала университета</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label className="field-label" htmlFor="login-username">
                  ЛОГИН
                </label>
                <input
                  id="login-username"
                  type="text"
                  className={`field-input ${loginError ? 'field-input--error' : ''}`}
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="student3"
                  autoComplete="username"
                />
                {loginError ? <p className="field-error">{loginError}</p> : null}
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor="login-password">
                  ПАРОЛЬ
                </label>
                <div className="password-input-wrap login-password-wrap">
                  <input
                    id="login-password"
                    type={passwordVisible ? 'text' : 'password'}
                    className={`field-input login-password-input ${passwordError ? 'field-input--error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-visibility-btn login-password-toggle"
                    aria-pressed={passwordVisible}
                    aria-label={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                    onClick={() => setPasswordVisible((v) => !v)}
                  >
                    {passwordVisible ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
                {passwordError ? <p className="field-error">{passwordError}</p> : null}
                <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Забыли пароль?
                </a>
              </div>

              <div className="checkbox-field">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-text">Запомнить меня на этом устройстве</span>
                </label>
              </div>

              <button type="submit" className="login-button" disabled={submitting}>
                {submitting ? 'Вход…' : 'Войти →'}
              </button>
            </form>

            <div className="ssl-section" />

            <p className="terms-text">
              Входя в систему, вы соглашаетесь с{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Политикой конфиденциальности
              </a>{' '}
              и{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Условиями использования
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
