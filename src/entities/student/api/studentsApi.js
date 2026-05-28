import axios from 'axios';
import { apiClient } from '/shared/lib/api/axios';
import { CreateStudentDuplicateLoginError } from '../lib/errors';
import { isStudentResponseShape } from '../lib/isStudentResponse';

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

  /**
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} [patronymic] — если пусто, параметр не отправляется (отчество необязательно)
   */
  searchByFullName: async (firstName, lastName, patronymic = '') => {
    const params = { 'first-name': firstName, 'last-name': lastName };
    const patronymicTrimmed = patronymic?.trim();
    if (patronymicTrimmed) {
      params.patronymic = patronymicTrimmed;
    }
    const response = await apiClient.get('/api/students/find-by-full-name', { params });
    return response.data;
  },

  getStudentsByGroup: async (groupId) => {
    const response = await apiClient.get('/api/students/find-by-group', {
      params: { 'group-id': groupId }
    });
    return response.data;
  },

  getStudentsByHealthGroup: async (healthGroupId) => {
    const response = await apiClient.get('/api/students/find-by-health-group', {
      params: { 'health-group-id': healthGroupId }
    });
    return response.data;
  },

  getStudentsBySection: async (sectionId) => {
    const response = await apiClient.get('/api/students/find-by-section', {
      params: { 'section-id': sectionId }
    });
    return response.data;
  },


  /**
   * POST /api/students/create. Успех: HTTP 201, тело — Student.
   * Ошибка 400 (логин занят): то же тело Student; выбрасывается CreateStudentDuplicateLoginError.
   *
   * @param {import('../model/types').CreateStudent} payload
   * @returns {Promise<import('../model/types').Student>}
   */
  createStudent: async (payload) => {
    try {
      const response = await apiClient.post('/api/students/create', payload);
      const { status, data } = response;
      if (status === 201) {
        return data;
      }
      throw new Error(`Создание студента: ожидался HTTP 201, получен ${status}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 400 && isStudentResponseShape(data)) {
          throw new CreateStudentDuplicateLoginError(
            'Студент с таким логином уже существует.',
            data
          );
        }
      }
      throw error;
    }
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

  updateHealthGroup: async (login, healthGroupId) => {
    const response = await apiClient.put('/api/students/update-health-group', null, {
      params: { login, healthGroupId },
    });
    return response.data;
  },

  getSchedule: async (login) => {
    const response = await apiClient.get('/api/students/schedule', {
      params: { login }
    });
    return response.data;
  },

  enrollSection: async (login, sectionId) => {
    const response = await apiClient.put('/api/students/enroll-section', null, {
      params: { login, 'section-id': sectionId },
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
