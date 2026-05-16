import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainPage } from '/pages/MainPage';
import { LoginPage } from '/pages/LoginPage';
import { AdminPage } from '/pages/AdminPage';
import { TeacherPage } from '/pages/TeacherPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
