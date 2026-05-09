import api from '@/services/api';
import { extractPaginatedItems } from '@/utils/apiMappers';

export async function getServicePrices(params = {}) {
  const response = await api.get('/pricing', { params: { page: 1, limit: 100, ...params } });
  return extractPaginatedItems(response.data);
}

export async function createServicePrice(payload) {
  const response = await api.post('/pricing', payload);
  return response.data;
}

export async function importServicePrices(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/pricing/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
}
