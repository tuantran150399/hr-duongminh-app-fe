import api from '@/services/api';
import { extractPaginatedItems, normalizePartner } from '@/utils/apiMappers';

export async function getPartners() {
  const response = await api.get('/partners', { params: { page: 1, limit: 100 } });
  const { items } = extractPaginatedItems(response.data);

  return items.map(normalizePartner).filter(Boolean);
}

export async function getPartnersMap() {
  const items = await getPartners();

  return items.reduce((result, partner) => {
    result[partner.backendId] = partner;
    return result;
  }, {});
}

export async function createPartner(payload) {
  const response = await api.post('/partners', payload);
  return response.data;
}

export async function updatePartner(id, payload) {
  const response = await api.put(`/partners/${id}`, payload);
  return response.data;
}

export async function deactivatePartner(id) {
  const response = await api.delete(`/partners/${id}`);
  return response.data;
}
