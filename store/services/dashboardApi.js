import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

/**
 * Dashboard API slice — RTK Query
 *
 * TODO: Cập nhật endpoint URL khi backend sẵn sàng.
 *
 * Hooks được sinh tự động:
 *   useGetDashboardStatsQuery()        — thống kê tổng quan
 *   useGetRevenueChartQuery(params?)   — dữ liệu biểu đồ doanh thu
 *   useGetCostChartQuery(params?)      — dữ liệu biểu đồ chi phí
 */
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
