import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export async function getAccountingRevenue() {
  const response = await api.get('/accounting/revenue', { params: { page: 1, limit: 50 } });
  const { items, meta } = extractPaginatedItems(response.data);

  return { items: items.map(normalizeEntry).filter(Boolean), meta };
}

export async function getAccountingCost() {
  const response = await api.get('/accounting/cost', { params: { page: 1, limit: 50 } });
  const { items, meta } = extractPaginatedItems(response.data);

  return { items: items.map(normalizeEntry).filter(Boolean), meta };
}

export async function createRevenueEntry(payload) {
  const response = await api.post('/accounting/revenue', payload);
  return response.data;
}

export async function createCostEntry(payload) {
  const response = await api.post('/accounting/cost', payload);
  return response.data;
}

export async function postRevenueEntry(id) {
  const response = await api.patch(`/accounting/revenue/${id}/post`);
  return response.data;
}

export async function postCostEntry(id) {
  const response = await api.patch(`/accounting/cost/${id}/post`);
  return response.data;
}

export async function voidRevenueEntry(id, reason) {
  const response = await api.post(`/accounting/revenue/${id}/void`, { reason });
  return response.data;
}

export async function voidCostEntry(id, reason) {
  const response = await api.post(`/accounting/cost/${id}/void`, { reason });
  return response.data;
}

export async function updateRevenuePaymentStatus(id, paymentStatus) {
  const response = await api.patch(`/accounting/revenue/${id}/payment-status`, { paymentStatus });
  return response.data;
}

export async function updateCostPaymentStatus(id, paymentStatus) {
  const response = await api.patch(`/accounting/cost/${id}/payment-status`, { paymentStatus });
  return response.data;
}
