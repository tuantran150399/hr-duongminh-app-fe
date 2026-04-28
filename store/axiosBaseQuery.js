import api from '@/services/api';

/**
 * Custom RTK Query baseQuery sử dụng axios instance đã setup sẵn
 * (auth interceptor, refresh token, base URL).
 *
 * Trả về format mà RTK Query yêu cầu: { data } hoặc { error }.
 *
 * @param {string | { url, method, data, params, headers }} args
 * @returns {{ data } | { error: { status, data } }}
 */
export async function axiosBaseQuery(args) {
  const request =
    typeof args === 'string'
      ? { url: args, method: 'GET' }
      : args;

  const { url, method = 'GET', data, params, headers } = request;

  try {
    const response = await api({
      url,
      method,
      data,
      params,
      headers
    });

    return { data: response.data };
  } catch (error) {
    return {
      error: {
        status: error.response?.status ?? 'FETCH_ERROR',
        data: error.response?.data ?? error.message
      }
    };
  }
}
