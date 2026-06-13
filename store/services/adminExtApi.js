import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeAuditLog, normalizeBranch, normalizeRole, normalizeUser } from '@/utils/apiMappers';

export const adminExtApi = createApi({
  reducerPath: 'adminExtApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User', 'Branch', 'Role', 'AuditLog'],
  endpoints: (builder) => ({
    // ── Users ─────────────────────────────────────────────────────────────────
    getUsers: builder.query({
      query: () => ({ url: '/users', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        return (items.length ? items : Array.isArray(response) ? response : [])
          .map(normalizeUser).filter(Boolean);
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User', id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }]
    }),

    createUser: builder.mutation({
      query: (payload) => ({ url: '/users', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),

    updateUser: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/users/${id}`, method: 'PATCH', data: payload }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }]
    }),

    blockUser: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/users/${id}/block`, method: 'PATCH', data: payload }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }]
    }),

    unblockUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/unblock`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }]
    }),

    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }]
    }),

    // ── Roles ─────────────────────────────────────────────────────────────────
    getRoles: builder.query({
      query: () => ({ url: '/roles', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        return (items.length ? items : Array.isArray(response) ? response : [])
          .map(normalizeRole).filter(Boolean);
      },
      providesTags: [{ type: 'Role', id: 'LIST' }]
    }),

    getPermissions: builder.query({
      query: () => ({ url: '/roles/permissions', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        return items.length ? items : Array.isArray(response) ? response : [];
      },
      providesTags: [{ type: 'Role', id: 'PERMISSIONS' }]
    }),

    createRole: builder.mutation({
      query: (payload) => ({ url: '/roles', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }]
    }),

    updateRole: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/roles/${id}`, method: 'PATCH', data: payload }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }]
    }),

    // ── Branches ─────────────────────────────────────────────────────────────
    getBranches: builder.query({
      query: () => ({ url: '/branches', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        return (items.length ? items : Array.isArray(response) ? response : [])
          .map(normalizeBranch).filter(Boolean);
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Branch', id })), { type: 'Branch', id: 'LIST' }]
          : [{ type: 'Branch', id: 'LIST' }]
    }),

    createBranch: builder.mutation({
      query: (payload) => ({ url: '/branches', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }]
    }),

    updateBranch: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/branches/${id}`, method: 'PATCH', data: payload }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Branch', id }, { type: 'Branch', id: 'LIST' }]
    }),

    // ── Audit Logs ────────────────────────────────────────────────────────────
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: '/audit-logs',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeAuditLog).filter(Boolean), meta };
      },
      providesTags: [{ type: 'AuditLog', id: 'LIST' }]
    })
  })
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useGetAuditLogsQuery
} = adminExtApi;
