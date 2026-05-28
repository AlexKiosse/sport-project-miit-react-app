import { apiClient } from '/shared/lib/api/axios';

export const teachersApi = {
  findAll: async () => {
    const response = await apiClient.get('/api/teachers/find-all');
    return response.data;
  },

  findByLogin: async (login) => {
    const response = await apiClient.get('/api/teachers/find-by-login', {
      params: { login },
    });
    return response.data;
  },

  findByLessonDate: async (date) => {
    const response = await apiClient.get('/api/teachers/get-by-lesson-date', {
      params: { date },
    });
    return response.data;
  },

  updateFullName: async (login, firstName, lastName, patronymic) => {
    const response = await apiClient.put('/api/teachers/update-full-name', null, {
      params: { login, firstName, lastName, patronymic },
    });
    return response.data;
  },

  updateLogin: async (oldLogin, newLogin) => {
    const response = await apiClient.put('/api/teachers/update-login', null, {
      params: { oldLogin, newLogin },
    });
    return response.data;
  },
};
