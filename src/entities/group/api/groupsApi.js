import { apiClient } from '../../../shared/lib/api/axios';

export const groupsApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/group/getAll');
    return response.data;
  },
};
