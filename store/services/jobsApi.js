import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeJob } from '@/utils/apiMappers';

export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (params = { page: 1, limit: 50 }) => ({
        url: '/jobs',
        method: 'GET',
        params
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map((job) => normalizeJob(job)).filter(Boolean), meta };
      },
      providesTags: (result) =>
        result?.items
          ? [
            ...result.items.map(({ id }) => ({ type: 'Job', id })),
            { type: 'Job', id: 'LIST' }
          ]
          : [{ type: 'Job', id: 'LIST' }]
    }),

    getJobById: builder.query({
      query: (id) => ({ url: `/jobs/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Job', id }]
    }),

    getJobDebtPreview: builder.mutation({
      query: (body) => ({ url: '/jobs/debt-preview', method: 'POST', data: body })
    }),

    createJob: builder.mutation({
      query: (body) => ({ url: '/jobs', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }]
    }),

    updateJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' }
      ]
    }),

    copyJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/jobs/${id}/copy`,
        method: 'POST',
        data: body
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }]
    }),

    cancelJob: builder.mutation({
      query: (id) => ({ url: `/jobs/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' }
      ]
    }),

    deleteJob: builder.mutation({
      query: (id) => ({ url: `/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }]
    }),

    exportJobs: builder.mutation({
      query: (params = {}) => ({
        url: '/jobs/export',
        method: 'POST',
        data: params,
        responseType: 'blob'
      })
    })
  })
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetJobDebtPreviewMutation,
  useCreateJobMutation,
  useUpdateJobMutation,
  useCopyJobMutation,
  useCancelJobMutation,
  useDeleteJobMutation,
  useExportJobsMutation
} = jobsApi;
