import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';
import { buildMockPaginatedResponse, mockCostEntries, mockRevenueEntries } from '@/utils/mockData';

export async function getAccountingRevenue() {
  try {
    const response = await api.get('/accounting/revenue', { params: { page: 1, limit: 50 } });
    const { items, meta } = extractPaginatedItems(response.data);
    return { items: items.map(normalizeEntry), meta };
  } catch (error) {
    const { items, meta } = buildMockPaginatedResponse(mockRevenueEntries, 1, 50);
    return { items: items.map(normalizeEntry), meta };
  }
}

export async function getAccountingCost() {
  try {
    const response = await api.get('/accounting/cost', { params: { page: 1, limit: 50 } });
    const { items, meta } = extractPaginatedItems(response.data);
    return { items: items.map(normalizeEntry), meta };
  } catch (error) {
    const { items, meta } = buildMockPaginatedResponse(mockCostEntries, 1, 50);
    return { items: items.map(normalizeEntry), meta };
  }
}
