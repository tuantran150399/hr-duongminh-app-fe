import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

// ── Charge-on-behalf (chi hộ) ──────────────────────────────────────────────
export async function getCobEntries(params = {}) {
  const response = await api.get('/accounting/cob', { params: { page: 1, limit: 50, ...params } });
  const { items } = extractPaginatedItems(response.data);
  return items.map(normalizeEntry).filter(Boolean);
}

export async function createCobEntry(payload) {
  const response = await api.post('/accounting/cob', payload);
  return response.data;
}

export async function markCostAsCob(costId, partnerId) {
  const response = await api.post(`/accounting/cost/${costId}/charge-on-behalf`, { partnerId });
  return response.data;
}

export async function settleCobEntry(id, body = {}) {
  const response = await api.patch(`/accounting/cob/${id}/settle`, body);
  return response.data;
}

// ── Collect-on-behalf (thu hộ) ─────────────────────────────────────────────
export async function getCollectOnBehalfEntries(params = {}) {
  const response = await api.get('/accounting/collect-on-behalf', { params: { page: 1, limit: 50, ...params } });
  const { items } = extractPaginatedItems(response.data);
  return items.map(normalizeEntry).filter(Boolean);
}

export async function createCollectOnBehalfEntry(payload) {
  const response = await api.post('/accounting/collect-on-behalf', payload);
  return response.data;
}

export async function settleCollectOnBehalf(id, body = {}) {
  const response = await api.patch(`/accounting/collect-on-behalf/${id}/settle`, body);
  return response.data;
}
