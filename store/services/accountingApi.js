import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export const accountingApi = createApi({
  reducerPath: 'accountingApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Revenue', 'Cost'],
  endpoints: (builder) => ({
    // ── Revenue ──────────────────────────────────────────────────────────────
    getAccountingRevenue: builder.query({
      query: (params = {}) => ({
        url: '/accounting/revenue',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeEntry).filter(Boolean), meta };
      },
      providesTags: ['Revenue']
    }),

    createRevenueEntry: builder.mutation({
      query: (payload) => ({ url: '/accounting/revenue', method: 'POST', data: payload }),
      invalidatesTags: ['Revenue']
    }),

    postRevenueEntry: builder.mutation({
      query: (id) => ({ url: `/accounting/revenue/${id}/post`, method: 'PATCH' }),
      invalidatesTags: ['Revenue']
    }),

    voidRevenueEntry: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/accounting/revenue/${id}/void`,
        method: 'POST',
        data: { reason }
      }),
      invalidatesTags: ['Revenue']
    }),

    updateRevenuePaymentStatus: builder.mutation({
      query: ({ id, paymentStatus }) => ({
        url: `/accounting/revenue/${id}/payment-status`,
        method: 'PATCH',
        data: { paymentStatus }
      }),
      invalidatesTags: ['Revenue']
    }),

    // ── Cost ─────────────────────────────────────────────────────────────────
    getAccountingCost: builder.query({
      query: (params = {}) => ({
        url: '/accounting/cost',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeEntry).filter(Boolean), meta };
      },
      providesTags: ['Cost']
    }),

    createCostEntry: builder.mutation({
      query: (payload) => ({ url: '/accounting/cost', method: 'POST', data: payload }),
      invalidatesTags: ['Cost']
    }),

    importCostEntries: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: '/accounting/cost/import', method: 'POST', data: formData };
      },
      invalidatesTags: ['Cost']
    }),

    postCostEntry: builder.mutation({
      query: (id) => ({ url: `/accounting/cost/${id}/post`, method: 'PATCH' }),
      invalidatesTags: ['Cost']
    }),

    voidCostEntry: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/accounting/cost/${id}/void`,
        method: 'POST',
        data: { reason }
      }),
      invalidatesTags: ['Cost']
    }),

    updateCostPaymentStatus: builder.mutation({
      query: ({ id, paymentStatus }) => ({
        url: `/accounting/cost/${id}/payment-status`,
        method: 'PATCH',
        data: { paymentStatus }
      }),
      invalidatesTags: ['Cost']
    }),

    // ── Charts ───────────────────────────────────────────────────────────────
    getRevenueChart: builder.query({
      query: (params = {}) => ({
        url: '/accounting/revenue/chart',
        method: 'GET',
        params
      }),
      providesTags: ['Revenue']
    }),

    getCostChart: builder.query({
      query: (params = {}) => ({
        url: '/accounting/cost/chart',
        method: 'GET',
        params
      }),
      providesTags: ['Cost']
    })
  })
});

export const {
  useGetAccountingRevenueQuery,
  useCreateRevenueEntryMutation,
  usePostRevenueEntryMutation,
  useVoidRevenueEntryMutation,
  useUpdateRevenuePaymentStatusMutation,
  useGetAccountingCostQuery,
  useCreateCostEntryMutation,
  useImportCostEntriesMutation,
  usePostCostEntryMutation,
  useVoidCostEntryMutation,
  useUpdateCostPaymentStatusMutation,
  useGetRevenueChartQuery,
  useGetCostChartQuery
} = accountingApi;
