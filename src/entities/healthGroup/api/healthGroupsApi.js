import { apiClient } from '../../../shared/lib/api/axios';

export const healthGroupsApi = {
  findAll: async () => {
    const response = await apiClient.get('/api/healthGroup/find-all');
    return response.data;
  },
};
