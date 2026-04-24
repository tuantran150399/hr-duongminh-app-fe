import api from '@/services/api';
import { partners } from '@/utils/mockData';
import { normalizePartner } from '@/utils/apiMappers';

export async function getPartners() {
  try {
    const response = await api.get('/partners');
    return Array.isArray(response.data) ? response.data.map(normalizePartner) : [];
  } catch {
    return partners;
  }
}

export async function getPartnersMap() {
  const items = await getPartners();
  return items.reduce((result, partner) => {
    result[partner.backendId] = partner;
    return result;
  }, {});
}
