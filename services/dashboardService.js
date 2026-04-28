import api from '@/services/api';
import { extractPaginatedItems } from '@/utils/apiMappers';
import { getMockDashboardStats } from '@/utils/mockData';

export async function getDashboardStats() {
  try {
    const [jobsResponse, revenueResponse, costResponse] = await Promise.all([
      api.get('/jobs', { params: { page: 1, limit: 100 } }),
      api.get('/accounting/revenue', { params: { page: 1, limit: 100 } }),
      api.get('/accounting/cost', { params: { page: 1, limit: 100 } })
    ]);

    const jobsResult = extractPaginatedItems(jobsResponse.data);
    const revenueResult = extractPaginatedItems(revenueResponse.data);
    const costResult = extractPaginatedItems(costResponse.data);

    const totalRevenue = revenueResult.items.reduce(
      (sum, item) => sum + Number(item.localAmount ?? item.amount ?? 0),
      0
    );
    const totalCost = costResult.items.reduce(
      (sum, item) => sum + Number(item.localAmount ?? item.amount ?? 0),
      0
    );

    return {
      totalJobs: jobsResult.meta?.total ?? jobsResult.items.length,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost
    };
  } catch (error) {
    return getMockDashboardStats();
  };
}
