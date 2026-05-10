import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export async function getDebitNotes(params = {}) {
  const response = await api.get('/debit-notes', { params: { page: 1, limit: 50, ...params } });
  const { items } = extractPaginatedItems(response.data);
  return items.map(normalizeEntry).filter(Boolean);
}

export async function createDebitNote(payload) {
  const response = await api.post('/debit-notes', payload);
  return response.data;
}

export async function updateDebitNote(id, payload) {
  const response = await api.put(`/debit-notes/${id}`, payload);
  return response.data;
}

export async function postDebitNote(id) {
  const response = await api.patch(`/debit-notes/${id}/post`);
  return response.data;
}

export async function voidDebitNote(id, reason) {
  const response = await api.post(`/debit-notes/${id}/void`, { reason });
  return response.data;
}

export async function sendDebitNote(id) {
  const response = await api.post(`/debit-notes/${id}/send`);
  return response.data;
}

export async function deleteDebitNote(id) {
  const response = await api.delete(`/debit-notes/${id}`);
  return response.data;
}
