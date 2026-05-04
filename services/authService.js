import api from '@/services/api';
import { setRefreshToken } from '@/utils/auth';

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });

  const token =
    response.data?.accessToken ||
    response.data?.access_token ||
    response.data?.token ||
    response.data?.jwt;

  if (!token) {
    throw new Error('Login response did not include a token');
  }

  const refreshToken =
    response.data?.refreshToken ||
    response.data?.refresh_token;

  if (refreshToken) {
    setRefreshToken(refreshToken);
  }

  return token;
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}
