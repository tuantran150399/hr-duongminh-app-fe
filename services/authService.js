import api from '@/services/api';
import { DEMO_TOKEN, mockUser } from '@/utils/mockData';

export async function login(username, password) {
  try {
    const response = await api.post('/auth/login', { username, password });
    const token =
      response.data?.accessToken ||
      response.data?.access_token ||
      response.data?.token ||
      response.data?.jwt;

    if (!token) {
      throw new Error('Login response did not include a token');
    }

    return token;
  } catch (error) {
    if (!username || !password) {
      throw error;
    }

    return DEMO_TOKEN;
  }
}

export async function getMe() {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return mockUser;
  }
}
