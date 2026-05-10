import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export const adjustmentsApi = createApi({
  reducerPath: 'adjustmentsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Adjustment'],
  endpoints: (builder) => ({
    getAdjustments: builder.query({
      query: (params = {}) => ({
        url: '/accounting/adjustments',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeEntry).filter(Boolean), meta };
      },
      providesTags: (result) =>
        result?.items
          ? [
            ...result.items.map(({ id }) => ({ type: 'Adjustment', id })),
            { type: 'Adjustment', id: 'LIST' }
          ]
          : [{ type: 'Adjustment', id: 'LIST' }]
    }),

    getAdjustmentById: builder.query({
      query: (id) => ({ url: `/accounting/adjustments/${id}`, method: 'GET' }),
      transformResponse: (response) => normalizeEntry(response),
      providesTags: (_result, _error, id) => [{ type: 'Adjustment', id }]
    }),

    getJobAdjustmentSummary: builder.query({
      query: (jobId) => ({ url: `/accounting/adjustments/job/${jobId}`, method: 'GET' }),
      providesTags: (_result, _error, jobId) => [{ type: 'Adjustment', id: `JOB_${jobId}` }]
    }),

    createAdjustment: builder.mutation({
      query: (payload) => ({
        url: '/accounting/adjustments',
        method: 'POST',
        data: payload
      }),
      invalidatesTags: [{ type: 'Adjustment', id: 'LIST' }]
    }),

    approveAdjustment: builder.mutation({
      query: (id) => ({
        url: `/accounting/adjustments/${id}/approve`,
        method: 'PATCH'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Adjustment', id },
        { type: 'Adjustment', id: 'LIST' }
      ]
    }),

    deleteAdjustment: builder.mutation({
      query: (id) => ({ url: `/accounting/adjustments/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Adjustment', id: 'LIST' }]
    })
  })
});

export const {
  useGetAdjustmentsQuery,
  useGetAdjustmentByIdQuery,
  useGetJobAdjustmentSummaryQuery,
  useCreateAdjustmentMutation,
  useApproveAdjustmentMutation,
  useDeleteAdjustmentMutation
} = adjustmentsApi;
