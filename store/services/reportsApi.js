import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    getBranchSummary: builder.query({
      query: (params = {}) => ({ url: '/reports/branch-summary', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'BRANCH_SUMMARY' }]
    }),

    getCustomerSummary: builder.query({
      query: (params = {}) => ({ url: '/reports/customer-summary', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'CUSTOMER_SUMMARY' }]
    }),

    getPnl: builder.query({
      query: (params = {}) => ({ url: '/reports/pnl', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'PNL' }]
    }),

    getCashFlow: builder.query({
      query: (params = {}) => ({ url: '/reports/cash-flow', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'CASH_FLOW' }]
    }),

    getJobStatusSummary: builder.query({
      query: (params = {}) => ({ url: '/reports/job-status-summary', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'JOB_STATUS' }]
    }),

    getReceivables: builder.query({
      query: (params = {}) => ({ url: '/reports/receivables', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'RECEIVABLES' }]
    }),

    getPayables: builder.query({
      query: (params = {}) => ({ url: '/reports/payables', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'PAYABLES' }]
    }),

    getOverdueReceivables: builder.query({
      query: (params = {}) => ({ url: '/reports/overdue-receivables', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'OVERDUE_RECEIVABLES' }]
    }),

    getOverduePayables: builder.query({
      query: (params = {}) => ({ url: '/reports/overdue-payables', method: 'GET', params }),
      providesTags: [{ type: 'Report', id: 'OVERDUE_PAYABLES' }]
    }),

    getProfitByJob: builder.query({
      query: (jobId) => ({ url: `/reports/profit/job/${jobId}`, method: 'GET' }),
      providesTags: (_result, _error, jobId) => [{ type: 'Report', id: `JOB_${jobId}` }]
    })
  })
});

export const {
  useGetBranchSummaryQuery,
  useGetCustomerSummaryQuery,
  useGetPnlQuery,
  useGetCashFlowQuery,
  useGetJobStatusSummaryQuery,
  useGetReceivablesQuery,
  useGetPayablesQuery,
  useGetOverdueReceivablesQuery,
  useGetOverduePayablesQuery,
  useGetProfitByJobQuery
} = reportsApi;
