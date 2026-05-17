import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeDebtPolicy } from '@/utils/apiMappers';

export const debtPoliciesApi = createApi({
  reducerPath: 'debtPoliciesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['DebtPolicy'],
  endpoints: (builder) => ({
    getDebtPolicies: builder.query({
      query: (params = {}) => ({
        url: '/debt-policies',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeDebtPolicy).filter(Boolean), meta };
      },
      providesTags: (result) =>
        result?.items
          ? [
            ...result.items.map(({ id }) => ({ type: 'DebtPolicy', id })),
            { type: 'DebtPolicy', id: 'LIST' }
          ]
          : [{ type: 'DebtPolicy', id: 'LIST' }]
    }),

    getDebtPolicyById: builder.query({
      query: (id) => ({ url: `/debt-policies/${id}`, method: 'GET' }),
      transformResponse: (response) => normalizeDebtPolicy(response),
      providesTags: (_result, _error, id) => [{ type: 'DebtPolicy', id }]
    }),

    upsertDebtPolicy: builder.mutation({
      query: (payload) => ({ url: '/debt-policies', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'DebtPolicy', id: 'LIST' }]
    })
  })
});

export const {
  useGetDebtPoliciesQuery,
  useGetDebtPolicyByIdQuery,
  useUpsertDebtPolicyMutation
} = debtPoliciesApi;
