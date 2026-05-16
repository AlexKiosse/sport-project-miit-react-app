import { apiClient } from '/shared/lib/api/axios';

export const sectionsApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/section/get-all');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/section/${id}`);
    return response.data;
  },

  getStudentsBySectionId: async (sectionId) => {
    const response = await apiClient.get(
      `/api/section/section-student-by-section-id/${sectionId}/students`
    );
    return response.data;
  },
};
