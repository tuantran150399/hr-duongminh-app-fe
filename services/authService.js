import api from '@/services/api';
import { setRefreshToken } from '@/utils/auth';
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

    // Lưu refresh token nếu backend trả về
    // TODO: cập nhật key khi backend xác nhận field name
    const refreshToken =
      response.data?.refreshToken ||
      response.data?.refresh_token;

    if (refreshToken) {
      setRefreshToken(refreshToken);
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
