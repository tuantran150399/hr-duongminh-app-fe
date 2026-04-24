import axios from 'axios';
import { clearToken, getToken, redirectToLogin } from '@/utils/auth';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3003/api/v1',
  timeout: 8000
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
