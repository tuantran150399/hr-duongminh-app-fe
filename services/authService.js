import api from '@/services/api';

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
    if (error.response) {
      throw error;
    }

    // Demo fallback lets the UI run before the NestJS API is available locally.
    return 'demo-local-jwt-token';
  }
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}
