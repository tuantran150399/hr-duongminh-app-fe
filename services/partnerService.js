import api from '@/services/api';
import { normalizePartner } from '@/utils/apiMappers';
import { getMockPartnersMap, mockPartners } from '@/utils/mockData';

export async function getPartners() {
  try {
    const response = await api.get('/partners');
    return Array.isArray(response.data) ? response.data.map(normalizePartner) : [];
  } catch (error) {
    return mockPartners.map(normalizePartner);
  }
}

export async function getPartnersMap() {
  try {
    const items = await getPartners();
    return items.reduce((result, partner) => {
      result[partner.backendId] = partner;
      return result;
    }, {});
  } catch (error) {
    return getMockPartnersMap();
  }
}
