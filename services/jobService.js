import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry, normalizeJob } from '@/utils/apiMappers';
import { getPartnersMap } from '@/services/partnerService';
import {
  buildMockPaginatedResponse,
  getMockCostByJob,
  getMockPartnersMap,
  getMockProfitSummary,
  getMockRevenueByJob,
  mockJobs
} from '@/utils/mockData';

export async function getJobs() {
  try {
    const [response, partnersById] = await Promise.all([
      api.get('/jobs', { params: { page: 1, limit: 50 } }),
      getPartnersMap()
    ]);
    const { items, meta } = extractPaginatedItems(response.data);

    return {
      items: items.map((job) => normalizeJob(job, partnersById)).filter(Boolean),
      meta
    };
  } catch (error) {
    const partnersById = getMockPartnersMap();
    const { items, meta } = buildMockPaginatedResponse(mockJobs, 1, 50);

    return {
      items: items.map((job) => normalizeJob(job, partnersById)).filter(Boolean),
      meta
    };
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
    const revenue = Array.isArray(revenueResponse.data) ? revenueResponse.data.map(normalizeEntry).filter(Boolean) : [];
    const cost = Array.isArray(costResponse.data) ? costResponse.data.map(normalizeEntry).filter(Boolean) : [];
    const profitSummary = profitResponse.data || null;

    return {
      ...normalizedJob,
      revenue,
      cost,
      profitSummary,
      raw: jobResponse.data
    };
  } catch (error) {
    const partnersById = getMockPartnersMap();
    const job = mockJobs.find((item) => String(item.id) === String(id)) || mockJobs[0];

    return {
      ...normalizeJob(job, partnersById),
      revenue: getMockRevenueByJob(job.id).map(normalizeEntry).filter(Boolean),
      cost: getMockCostByJob(job.id).map(normalizeEntry).filter(Boolean),
      profitSummary: getMockProfitSummary(job.id),
      raw: job
    };
  }
}
