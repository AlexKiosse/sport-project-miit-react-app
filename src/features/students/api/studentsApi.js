// src/features/students/api/studentsApi.js
import { apiClient } from '../../../shared/lib/api/axios';

export const studentsApi = {
  getAllStudents: async () => {
    const response = await apiClient.get('/api/students/find-all');
    return response.data;
  },

  getStudentByLogin: async (login) => {
    const response = await apiClient.get('/api/students/find-by-login', {
      params: { login }
    });
    return response.data;
  },

  searchByFullName: async (firstName, lastName, patronymic = '') => {
    const response = await apiClient.get('/api/students/find-by-full-name', {
      params: { 'first-name': firstName, 'last-name': lastName, patronymic }
    });
    return response.data;
  },

  getStudentsByGroup: async (groupId) => {
    const response = await apiClient.get('/api/students/find-by-group', {
      params: { 'group-id': groupId }
    });
    return response.data;
  },

  getStudentsBySection: async (sectionId) => {
    const response = await apiClient.get('/api/students/find-by-section', {
      params: { 'section-id': sectionId }
    });
    return response.data;
  },


  createStudent: async (studentData) => {
    const response = await apiClient.post('/api/students/create', studentData);
    return response.data;
  },

  deleteStudentById: async (id) => {
    const response = await apiClient.delete(`/api/students/${id}`);
    return response.data;
  },


  deleteStudentByLogin: async (login) => {
    const response = await apiClient.delete(`/api/students/by-login/${login}`);
    return response.data;
  },

  updateFullName: async (login, firstName, lastName, patronymic) => {
    const response = await apiClient.put('/api/students/update-full-name', null, {
      params: { login, firstName, lastName, patronymic }
    });
    return response.data;
  },

  updateLogin: async (oldLogin, newLogin) => {
    const response = await apiClient.put('/api/students/update-login', null, {
      params: { oldLogin, newLogin }
    });
    return response.data;
  },

  getSchedule: async (login) => {
    const response = await apiClient.get('/api/students/schedule', {
      params: { login }
    });
    return response.data;
  },

  checkStudentExists: async (login) => {
    const response = await apiClient.get('/api/students/is-exists-by-login', {
      params: { login }
    });
    return response.data;
  },
};