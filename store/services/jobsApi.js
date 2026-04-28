import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

/**
 * Jobs API slice — RTK Query
 *
 * TODO: Cập nhật endpoint URL khi backend sẵn sàng.
 *
 * Hooks được sinh tự động:
 *   useGetJobsQuery(params?)           — danh sách jobs (có phân trang)
 *   useGetJobByIdQuery(id)             — chi tiết 1 job
 *   useCreateJobMutation()             — tạo job mới
 *   useUpdateJobMutation()             — cập nhật job
 *   useDeleteJobMutation()             — xoá job
 */
export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (params = { page: 1, limit: 50 }) => ({
        url: '/jobs',
        method: 'GET',
        params
      }),
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

    deleteJob: builder.mutation({
      query: (id) => ({ url: `/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }]
    })
  })
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation
} = jobsApi;
