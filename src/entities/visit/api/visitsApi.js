import { apiClient } from '/shared/lib/api/axios';

export const visitsApi = {
  findByLesson: async (lessonId) => {
    const response = await apiClient.get(`/api/visits/lesson/${lessonId}`);
    return response.data;
  },

  findByStudent: async (login) => {
    const response = await apiClient.get(`/api/visits/student/${login}`);
    return response.data;
  },

  getAttendanceMap: async (studentLogin) => {
    const response = await apiClient.get(`/api/visits/attendanceMap/${studentLogin}`);
    return response.data;
  },

  getAttendancePercentage: async (studentLogin) => {
    const response = await apiClient.get(`/api/visits/attendancePercentage/${studentLogin}`);
    return response.data;
  },

  getTotalAbsences: async (studentLogin) => {
    const response = await apiClient.get(`/api/visits/get-total-absences/${studentLogin}`);
    return response.data;
  },

  updateStatus: async (visitId, exists) => {
    const response = await apiClient.put(`/api/visits/update/${visitId}/status/${exists}`);
    return response.data;
  },

  findByDateRange: async (from, to) => {
    const response = await apiClient.get('/api/visits/range', {
      params: { from, to },
    });
    return response.data;
  },
};
