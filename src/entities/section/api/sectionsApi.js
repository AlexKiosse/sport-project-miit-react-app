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

  enrollStudent: async (sectionId, studentLogin) => {
    const response = await apiClient.post(`/api/section/${sectionId}/enroll`, null, {
      params: { studentLogin },
    });
    return response.data;
  },

  /**
   * @param {number} sectionId
   * @param {string} [since] ISO-8601 datetime
   */
  getNewEnrollments: async (sectionId, since) => {
    const params = since ? { since } : {};
    const response = await apiClient.get(`/api/section/${sectionId}/new-enrollments`, {
      params,
    });
    return response.data;
  },
};
