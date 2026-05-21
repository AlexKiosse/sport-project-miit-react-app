import { apiClient } from '/shared/lib/api/axios';

export const authApi = {
  /**
   * @param {string} login
   * @param {string} password
   * @returns {Promise<{ role: string, id: number, login: string, firstName: string, lastName: string, patronymic?: string }>}
   */
  login: async (login, password) => {
    const response = await apiClient.post('/api/auth/login', { login, password });
    return response.data;
  },
};
