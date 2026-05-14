// src/shared/lib/api/axios.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error: ', error.response?.status, error.response?.data);

        if (error.response?.status === 401) {
            window.location.href = '/login';
        }

        if (error.response?.status === 403) {
            alert('Доступ запрещён')
        }
        
        return
    }
);