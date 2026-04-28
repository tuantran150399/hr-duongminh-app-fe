import axios from 'axios';
import {
  clearAllTokens,
  getRefreshToken,
  getToken,
  redirectToLogin,
  setToken
} from '@/utils/auth';

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

// --------------------------------------------------------------------------
// Refresh token logic
// --------------------------------------------------------------------------

let isRefreshing = false;
let pendingQueue = []; // [{resolve, reject}]

function processPendingQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  // TODO: update endpoint when backend is ready
  const response = await axios.post(
    `${resolveApiBaseUrl()}/auth/refresh`,
    { refreshToken },
    { timeout: 8000 }
  );

  const newToken =
    response.data?.accessToken ||
    response.data?.access_token ||
    response.data?.token;

  if (!newToken) throw new Error('Refresh response did not include a token');

  setToken(newToken);
  return newToken;
}

// --------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// --------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// --------------------------------------------------------------------------
// Response interceptor — handle 401 with refresh token retry
// --------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not for the refresh endpoint itself
    // _retry flag prevents infinite retry loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh resolves
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processPendingQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processPendingQueue(refreshError, null);
        clearAllTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
