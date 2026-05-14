// src/pages/LoginPage/ui/LoginPage.js
import React, { useState } from 'react';
import './LoginPage.css';
import loginImage from '../../../images/Miit.jpg';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Remember me:', rememberMe);
  };

  return (
    <div className="app">
      <div className="grid-container">
        <div className="left-panel">
          <img src={loginImage} alt="Спорт в МИИТ" />
          <div className="image-overlay">
            <div className="image-content">
              <p className="image-text">
                Единая платформа для отслеживания спортивных успехов студентов РУТ (МИИТ)
              </p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="login-card">
            <h1 className="main-title">
              РУТ МИИТ
              <br />
            </h1>


            <hr className="divider" />

            <h2 className="login-heading">Вход в систему</h2>
            <p className="login-subtitle">Используйте учетную запись портала университета</p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="field-label">EMAIL</label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@edu.rut-miit.ru"
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label">ПАРОЛЬ</label>
                <input
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
                <a href="#" className="forgot-link">Забыли пароль?</a>
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

              <button type="submit" className="login-button">
                Войти →
              </button>
            </form>

            <div className="ssl-section">
            </div>

            <p className="terms-text">
              Входя в систему, вы соглашаетесь с{' '}
              <a href="#">Политикой конфиденциальности</a> и{' '}
              <a href="#">Условиями использования</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

