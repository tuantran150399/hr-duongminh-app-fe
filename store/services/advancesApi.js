import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

export const advancesApi = createApi({
  reducerPath: 'advancesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Advances'],
  endpoints: (builder) => ({
    getAdvances: builder.query({
      query: (params = {}) => ({
        url: '/advances',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const items = response?.data ?? response?.items ?? (Array.isArray(response) ? response : []);
        return { items };
      },
      providesTags: ['Advances']
    }),
    createAdvance: builder.mutation({
      query: (payload) => ({
        url: '/advances',
        method: 'POST',
        data: payload
      }),
      invalidatesTags: ['Advances']
    }),
    approveAdvance: builder.mutation({
      query: (id) => ({
        url: `/advances/${id}/approve`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Advances']
    }),
    rejectAdvance: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/advances/${id}/reject`,
        method: 'PATCH',
        data: { reason }
      }),
      invalidatesTags: ['Advances']
    }),
    settleAdvance: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/advances/${id}/settle`,
        method: 'PATCH',
        data: payload
      }),
      invalidatesTags: ['Advances']
    })
  })
});

export const {
  useGetAdvancesQuery,
  useCreateAdvanceMutation,
  useApproveAdvanceMutation,
  useRejectAdvanceMutation,
  useSettleAdvanceMutation
} = advancesApi;
