import api from '@/services/api';

export async function getBranchSummary(params) {
  const response = await api.get('/reports/branch-summary', { params });
  return response.data;
}

export async function getCustomerSummary(params) {
  const response = await api.get('/reports/customer-summary', { params });
  return response.data;
}

export async function getPnl(params) {
  const response = await api.get('/reports/pnl', { params });
  return response.data;
}

export async function getCashFlow(params) {
  const response = await api.get('/reports/cash-flow', { params });
  return response.data;
}

export async function getJobStatusSummary(params) {
  const response = await api.get('/reports/job-status-summary', { params });
  return response.data;
}

export async function getReceivables(params) {
  const response = await api.get('/reports/receivables', { params });
  return response.data;
}

export async function getPayables(params) {
  const response = await api.get('/reports/payables', { params });
  return response.data;
}

export async function getOverdueReceivables(params) {
  const response = await api.get('/reports/overdue-receivables', { params });
  return response.data;
}

export async function getOverduePayables(params) {
  const response = await api.get('/reports/overdue-payables', { params });
  return response.data;
}

export async function getProfitByJob(jobId) {
  const response = await api.get(`/reports/profit/job/${jobId}`);
  return response.data;
}

export async function exportReport(reportKey, params) {
  const response = await api.get(`/reports/${reportKey}/export`, {
    params,
    responseType: 'blob'
  });

  return {
    blob: response.data,
    fileName: response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/^"|"$/g, '') || `${reportKey}.xlsx`
  };
}
