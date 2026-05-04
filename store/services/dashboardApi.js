import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({ url: '/dashboard/stats', method: 'GET' }),
      providesTags: [{ type: 'Dashboard', id: 'STATS' }]
    }),

    getRevenueChart: builder.query({
      query: (params) => ({
        url: '/accounting/revenue/chart',
        method: 'GET',
        params
      }),
      providesTags: [{ type: 'Dashboard', id: 'REVENUE_CHART' }]
    }),

    getCostChart: builder.query({
      query: (params) => ({
        url: '/accounting/cost/chart',
        method: 'GET',
        params
      }),
      providesTags: [{ type: 'Dashboard', id: 'COST_CHART' }]
    })
  })
});

export const {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetCostChartQuery
} = dashboardApi;
