import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import {
  extractPaginatedItems,
  normalizeUser,
  normalizeBranch
} from '@/utils/apiMappers';

/**
 * RTK Query API cho admin endpoints — users, branches.
 * Dùng chung cho Jobs Create/Detail (dropdown options) và Users/Branches pages.
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User', 'Branch'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        const list = items.length ? items : Array.isArray(response) ? response : [];
        return list.map(normalizeUser).filter(Boolean);
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'User', id })),
            { type: 'User', id: 'LIST' }
          ]
          : [{ type: 'User', id: 'LIST' }]
    }),

    getBranches: builder.query({
      query: () => ({ url: '/branches', method: 'GET' }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        const list = items.length ? items : Array.isArray(response) ? response : [];
        return list.map(normalizeBranch).filter(Boolean);
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Branch', id })),
            { type: 'Branch', id: 'LIST' }
          ]
          : [{ type: 'Branch', id: 'LIST' }]
    })
  })
});

export const {
  useGetUsersQuery,
  useGetBranchesQuery
} = adminApi;
