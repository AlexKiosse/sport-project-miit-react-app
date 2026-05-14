// src/app/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { MainPage } from '../pages/MainPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage} from '../pages/AdminPage'
import './App.css';

function App() {
  return (
    <BrowserRouter>
    {/* <nav className='main-nav'>
      <Link to="/">Главная</Link>
      <Link to="/login">Вход</Link>
    </nav> */}

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;