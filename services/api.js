import axios from 'axios';
import { clearToken, getToken, redirectToLogin } from '@/utils/auth';

function resolveApiBaseUrl() {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';

    if (isLocalHost) {
      return 'http://localhost:3003/api/v1';
    }
  }

  // Production-safe fallback for static deployments behind the same host/reverse proxy.
  return '/api/v1';
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
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
