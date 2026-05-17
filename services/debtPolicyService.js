import api from '@/services/api';
import { extractPaginatedItems, normalizeDebtPolicy } from '@/utils/apiMappers';

export async function getDebtPolicies(params) {
  const response = await api.get('/debt-policies', { params: { page: 1, limit: 50, ...params } });
  const { items, meta } = extractPaginatedItems(response.data);
  return { items: items.map(normalizeDebtPolicy).filter(Boolean), meta };
}

export async function getDebtPolicyById(id) {
  const response = await api.get(`/debt-policies/${id}`);
  return normalizeDebtPolicy(response.data);
}

export async function upsertDebtPolicy(payload) {
  const response = await api.post('/debt-policies', payload);
  return response.data;
}
