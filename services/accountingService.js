import api from '@/services/api';
import { accountingCost, accountingRevenue } from '@/utils/mockData';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export async function getAccountingRevenue() {
  try {
    const response = await api.get('/accounting/revenue', { params: { page: 1, limit: 50 } });
    const { items, meta } = extractPaginatedItems(response.data);
    return { items: items.map(normalizeEntry), meta };
  } catch {
    return { items: accountingRevenue, meta: null };
  }
}

export async function getAccountingCost() {
  try {
    const response = await api.get('/accounting/cost', { params: { page: 1, limit: 50 } });
    const { items, meta } = extractPaginatedItems(response.data);
    return { items: items.map(normalizeEntry), meta };
  } catch {
    return { items: accountingCost, meta: null };
  }
}
