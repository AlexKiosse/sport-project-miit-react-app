import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainPage } from '/pages/MainPage';
import { LoginPage } from '/pages/LoginPage';
import { AdminPage } from '/pages/AdminPage';
import { TeacherPage } from '/pages/TeacherPage';
import { StudentPage } from '/pages/StudentPage';
import { StudentProfilePage } from '/pages/StudentProfilePage';
import { TeacherProfilePage } from '/pages/TeacherProfilePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/teacher/profile" element={<TeacherProfilePage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
