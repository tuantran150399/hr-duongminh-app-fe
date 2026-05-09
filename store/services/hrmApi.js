import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

export const hrmApi = createApi({
  reducerPath: 'hrmApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Employee', 'Attendance', 'Leave', 'Payroll'],
  endpoints: (builder) => ({
    // ── Employees ─────────────────────────────────────────────────────────────
    getEmployees: builder.query({
      query: (params = {}) => ({
        url: '/hr/employees',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const items = response?.data?.items ?? response?.items ?? (Array.isArray(response) ? response : []);
        return { items };
      },
      providesTags: (result) =>
        result?.items
          ? [
            ...result.items.map(({ id }) => ({ type: 'Employee', id })),
            { type: 'Employee', id: 'LIST' }
          ]
          : [{ type: 'Employee', id: 'LIST' }]
    }),

    createEmployee: builder.mutation({
      query: (payload) => ({ url: '/hr/employees', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }]
    }),

    updateEmployee: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/hr/employees/${id}`, method: 'PATCH', data: payload }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employee', id }, { type: 'Employee', id: 'LIST' }]
    }),

    // ── Attendance ────────────────────────────────────────────────────────────
    getAttendance: builder.query({
      query: (params = {}) => ({
        url: '/hrm/attendance',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const items = response?.data?.items ?? response?.items ?? (Array.isArray(response) ? response : []);
        return { items };
      },
      providesTags: ['Attendance']
    }),

    createAttendance: builder.mutation({
      query: (payload) => ({ url: '/hrm/attendance', method: 'POST', data: payload }),
      invalidatesTags: ['Attendance']
    }),

    // ── Leave Requests ────────────────────────────────────────────────────────
    getLeaveRequests: builder.query({
      query: (params = {}) => ({
        url: '/hrm/leaves',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const items = response?.data?.items ?? response?.items ?? (Array.isArray(response) ? response : []);
        return { items };
      },
      providesTags: ['Leave']
    }),

    createLeaveRequest: builder.mutation({
      query: (payload) => ({ url: '/hrm/leaves', method: 'POST', data: payload }),
      invalidatesTags: ['Leave']
    }),

    approveLeaveRequest: builder.mutation({
      query: (id) => ({ url: `/hrm/leaves/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['Leave']
    }),

    rejectLeaveRequest: builder.mutation({
      query: ({ id, reason }) => ({ url: `/hrm/leaves/${id}/reject`, method: 'PATCH', data: { reason } }),
      invalidatesTags: ['Leave']
    }),

    // ── Payroll ───────────────────────────────────────────────────────────────
    getPayroll: builder.query({
      query: (params = {}) => ({
        url: '/hrm/payroll',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const items = response?.data?.items ?? response?.items ?? (Array.isArray(response) ? response : []);
        return { items };
      },
      providesTags: ['Payroll']
    }),

    createPayrollRecord: builder.mutation({
      query: (payload) => ({ url: '/hrm/payroll', method: 'POST', data: payload }),
      invalidatesTags: ['Payroll']
    }),

    finalizePayroll: builder.mutation({
      query: (id) => ({ url: `/hrm/payroll/${id}/finalize`, method: 'PATCH' }),
      invalidatesTags: ['Payroll']
    })
  })
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useGetPayrollQuery,
  useCreatePayrollRecordMutation,
  useFinalizePayrollMutation
} = hrmApi;
