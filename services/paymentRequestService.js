import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export async function getPaymentRequests(params) {
  const response = await api.get('/payment-requests', { params: { page: 1, limit: 50, ...params } });
  const { items, meta } = extractPaginatedItems(response.data);
  return { items: items.map(normalizeEntry).filter(Boolean), meta };
}

export async function getPaymentRequestById(id) {
  const response = await api.get(`/payment-requests/${id}`);
  return normalizeEntry(response.data);
}

export async function createPaymentRequest(payload) {
  const response = await api.post('/payment-requests', payload);
  return response.data;
}

export async function approvePaymentRequest(id) {
  const response = await api.patch(`/payment-requests/${id}/approve`);
  return response.data;
}

export async function finalApprovePaymentRequest(id) {
  const response = await api.patch(`/payment-requests/${id}/final-approve`);
  return response.data;
}

export async function rejectPaymentRequest(id, reason) {
  const response = await api.patch(`/payment-requests/${id}/reject`, { reason });
  return response.data;
}
