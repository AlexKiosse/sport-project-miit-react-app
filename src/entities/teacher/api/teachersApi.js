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
};
