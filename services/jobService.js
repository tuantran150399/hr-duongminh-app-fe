import api from '@/services/api';
import { extractPaginatedItems, normalizeEntry, normalizeJob } from '@/utils/apiMappers';
import { getPartnersMap } from '@/services/partnerService';

export async function getJobs() {
  const [response, partnersById] = await Promise.all([
    api.get('/jobs', { params: { page: 1, limit: 50 } }),
    getPartnersMap()
  ]);
  const { items, meta } = extractPaginatedItems(response.data);

  return {
    items: items.map((job) => normalizeJob(job, partnersById)).filter(Boolean),
    meta
  };
}

export async function getJobById(id) {
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
}

export async function createJob(payload) {
  const response = await api.post('/jobs', payload);
  return response.data;
}

export async function updateJob(id, payload) {
  const response = await api.put(`/jobs/${id}`, payload);
  return response.data;
}

export async function copyJob(id, payload) {
  const response = await api.post(`/jobs/${id}/copy`, payload);
  return response.data;
}

export async function cancelJob(id) {
  const response = await api.patch(`/jobs/${id}/cancel`);
  return response.data;
}

export async function archiveJob(id) {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
}
