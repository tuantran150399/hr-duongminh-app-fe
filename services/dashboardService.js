import api from '@/services/api';

export async function getDashboardStats() {
  const response = await api.get('/dashboard/stats');

  return {
    totalJobs: Number(response.data?.totalJobs ?? 0),
    totalRevenue: Number(response.data?.totalRevenue ?? 0),
    totalCost: Number(response.data?.totalCost ?? 0),
    profit: Number(response.data?.profit ?? 0)
  };
}
