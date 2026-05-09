import api from '@/services/api';

// ─── Employee Advances ────────────────────────────────────────────────────────

export async function getAdvances(params = {}) {
  const response = await api.get('/advances', { params: { page: 1, limit: 100, ...params } });
  const data = response.data;
  const items = data?.data ?? data?.items ?? (Array.isArray(data) ? data : []);
  return { items };
}

export async function createAdvance(payload) {
  const response = await api.post('/advances', payload);
  return response.data;
}

export async function approveAdvance(id) {
  const response = await api.patch(`/advances/${id}/approve`);
  return response.data;
}

export async function rejectAdvance(id, reason) {
  const response = await api.patch(`/advances/${id}/reject`, { reason });
  return response.data;
}

export async function settleAdvance(id, payload) {
  const response = await api.patch(`/advances/${id}/settle`, payload);
  return response.data;
}
