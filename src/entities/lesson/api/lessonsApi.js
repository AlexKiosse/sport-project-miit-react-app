import { apiClient } from '/shared/lib/api/axios';

export const lessonsApi = {
  findAll: async () => {
    const response = await apiClient.get('/api/lessons/find-all');
    return response.data;
  },

  findByTeacher: async (teacherId) => {
    const response = await apiClient.get(`/api/lessons/teacher/${teacherId}`);
    return response.data;
  },

  findByDateRange: async (from, to) => {
    const response = await apiClient.get('/api/lessons/range', {
      params: { from, to },
    });
    return response.data;
  },

  findById: async (id) => {
    const response = await apiClient.get(`/api/lessons/${id}`);
    return response.data;
  },

  getDetails: async (id) => {
    const response = await apiClient.get(`/api/lessons/${id}/details`);
    return response.data;
  },

  getExpectedStudents: async (id) => {
    const response = await apiClient.get(`/api/lessons/${id}/expected-students`);
    return response.data;
  },

  getAttendance: async (id) => {
    const response = await apiClient.get(`/api/lessons/${id}/attendance`);
    return response.data;
  },

  markAttendance: async (id, studentLogin, present) => {
    const response = await apiClient.post(`/api/lessons/${id}/attendance`, null, {
      params: { studentLogin, present },
    });
    return response.data;
  },

  bulkMarkAttendance: async (id, attendanceMap) => {
    const response = await apiClient.post(`/api/lessons/${id}/attendance/bulk`, attendanceMap);
    return response.data;
  },
};
