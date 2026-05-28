import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import basketball from '/shared/images/basketball.jpg';
import swim from '/shared/images/swim.jpg';
import volleyball from '/shared/images/volleyball.jpg';
import martialArts from '/shared/images/martialArts.jpg';
import cup from '/shared/images/cup.jpg';
import masterClass from '/shared/images/masterClass.jpg';
import bgImage from '/shared/images/backgroundImage.jpg';

export const MainPage = () => {
  const [activePage, setActivePage] = useState('home');
  const navigate = useNavigate();

  return (
    <div className="main-page">
      {/* НАВИГАЦИЯ */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <h1 className="logo">Все на <span>спорт</span></h1>
          </div>
          <div className="nav-center">
            <button 
              className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => setActivePage('home')}
            >
              Главная
            </button>
            <button 
              className={`nav-link ${activePage === 'sections' ? 'active' : ''}`}
              onClick={() => setActivePage('sections')}
            >
              Секции
            </button>
            <button 
              className={`nav-link ${activePage === 'schedule' ? 'active' : ''}`}
              onClick={() => setActivePage('schedule')}
            >
              Расписание
            </button>
            <button 
              className={`nav-link ${activePage === 'teachers' ? 'active' : ''}`}
              onClick={() => setActivePage('teachers')}
            >
              Преподаватели
            </button>
          </div>
          <div className="nav-right">
            <button type="button" className="login-btn" onClick={() => navigate('/login')}>
              Войти
            </button>
          </div>
        </div>
      </nav>

      {/* Cекция c картинкой */}
      <section className="hero">
        <div className="hero-content">
          <h1>Все на спорт</h1>
          <p>Твой путь к спортивным достижениям начинается здесь. Выбирай секцию, следи за расписанием и становись частью большой семьи</p>
        </div>
      </section>

      {/* НОВОСТИ */}
      <section className="news-section">
        <div className="container">
          <h2>Новости портала</h2>
          <div className="news-grid">
            {/* Новость 1 */}
            <div className="news-card">
              <div className="news-image">
                <img src={masterClass} alt="Мастер-класс" className="news-img-placeholder" />
              </div>
              <div className="news-tag orange">МАСТЕР-КЛАСС</div>
              <h3>Техника волейбола с мастером спорта</h3>
              <p>Разбор основных ошибок и секреты профессиональной подачи...</p>
              <a href="#" className="read-more">Читать далее →</a>
            </div>

            {/* Новость 2 */}
            <div className="news-card">
              <div className="news-image">
                <img src={cup} alt="Победа" className="news-img-placeholder" />
              </div>
              <div className="news-tag green">ПОБЕДА</div>
              <h3>Итоги межвузовских соревнований</h3>
              <p>Наши студенты заняли первое общекомандное место в турнире...</p>
              <a href="#" className="read-more">Читать далее →</a>
            </div>
          </div>
        </div>
      </section>

      {/* СПОРТИВНЫЕ СЕКЦИИ*/}
      <section className="sports-section">
        <div className="container">
          <h2 className="section-title">Спортивные секции</h2>
          <p className="section-subtitle">
            Выберите направление, которое подходит именно вам. Все занятия бесплатны для студентов и сотрудников университета.
          </p>
          <div className="sports-grid">
            {/* Секция 1 */}
            <div className="sport-card">
              <div className="sport-image">
                <img src={basketball} alt="Баскетбол" className="sport-img-placeholder" />
              </div>
              <h3>Баскетбол</h3>
              <div className="coach">А. С. Волков</div>
              <div className="schedule">Пн, Ср, Пт | 18:30 - 20:00</div>
              <a href="#" className="sport-link">Подробнее</a>
            </div>

            {/* Секция 2 */}
            <div className="sport-card">
              <div className="sport-image">
                <img src={swim} alt="Плавание" className="sport-img-placeholder" />
              </div>
              <h3>Плавание</h3>
              <div className="coach">Е. М. Петрова</div>
              <div className="schedule">Вт, Чт, Сб | 07:00 - 08:30</div>
              <a href="#" className="sport-link">Подробнее</a>
            </div>

            {/* Секция 3 */}
            <div className="sport-card">
              <div className="sport-image">
                <img src={volleyball} alt="Волейбол" className="sport-img-placeholder" />
              </div>
              <h3>Волейбол</h3>
              <div className="coach">И. И. Иванов</div>
              <div className="schedule">Пн, Ср | 17:00 - 18:30</div>
              <a href="#" className="sport-link">Подробнее</a>
            </div>

            {/* Секция 4 */}
            <div className="sport-card">
              <div className="sport-image">
                <img src={martialArts} alt="Единоборства" className="sport-img-placeholder" />
              </div>
              <h3>Единоборства</h3>
              <div className="coach">Д. В. Козлов</div>
              <div className="schedule">Вт, Пт | 19:00 - 20:30</div>
              <a href="#" className="sport-link">Подробнее</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};