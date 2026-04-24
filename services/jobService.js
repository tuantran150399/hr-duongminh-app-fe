import api from '@/services/api';
import { jobFinancials, jobs } from '@/utils/mockData';
import { extractPaginatedItems, normalizeEntry, normalizeJob } from '@/utils/apiMappers';
import { getPartnersMap } from '@/services/partnerService';

export async function getJobs() {
  try {
    const [response, partnersById] = await Promise.all([
      api.get('/jobs', { params: { page: 1, limit: 50 } }),
      getPartnersMap()
    ]);
    const { items, meta } = extractPaginatedItems(response.data);

    return {
      items: items.map((job) => normalizeJob(job, partnersById)),
      meta
    };
  } catch {
    return { items: jobs, meta: null };
  }
}

export async function getJobById(id) {
  try {
    const [jobResponse, revenueResponse, costResponse, profitResponse, partnersById] = await Promise.all([
      api.get(`/jobs/${id}`),
      api.get(`/accounting/revenue/job/${id}`),
      api.get(`/accounting/cost/job/${id}`),
      api.get(`/accounting/profit/job/${id}`),
      getPartnersMap()
    ]);

    const normalizedJob = normalizeJob(jobResponse.data, partnersById);
    const revenue = Array.isArray(revenueResponse.data) ? revenueResponse.data.map(normalizeEntry) : [];
    const cost = Array.isArray(costResponse.data) ? costResponse.data.map(normalizeEntry) : [];
    const profitSummary = profitResponse.data || null;

    return {
      ...normalizedJob,
      revenue,
      cost,
      profitSummary,
      raw: jobResponse.data
    };
  } catch {
    const job = jobs.find((item) => item.id === id);
    const financials = jobFinancials[id] || { revenue: [], cost: [] };
    return job ? { ...job, ...financials } : null;
  }
}
