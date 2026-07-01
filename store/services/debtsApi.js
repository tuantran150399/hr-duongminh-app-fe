import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import {
  extractPaginatedItems,
  normalizeDebtSummary,
  normalizeDebtCustomer,
  normalizeDebtItem
} from '@/utils/apiMappers';

export const debtsApi = createApi({
  reducerPath: 'debtsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['DebtSummary', 'DebtCustomer', 'DebtItem'],
  endpoints: (builder) => ({
    getDebtSummary: builder.query({
      query: () => ({ url: '/debts/summary', method: 'GET' }),
      transformResponse: (response) => normalizeDebtSummary(response),
      providesTags: [{ type: 'DebtSummary', id: 'SUMMARY' }]
    }),
    getDebtCustomers: builder.query({
      query: (params = {}) => ({
        url: '/debts/customers',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeDebtCustomer).filter(Boolean), meta };
      },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'DebtCustomer', id })),
              { type: 'DebtCustomer', id: 'LIST' }
            ]
          : [{ type: 'DebtCustomer', id: 'LIST' }]
    }),
    getDebtItemsByCustomer: builder.query({
      query: (customerId) => ({
        url: `/debts/customers/${customerId}/items`,
        method: 'GET'
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeDebtItem).filter(Boolean), meta };
      },
      providesTags: (result, _error, customerId) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'DebtItem', id })),
              { type: 'DebtItem', id: `LIST-${customerId}` }
            ]
          : [{ type: 'DebtItem', id: `LIST-${customerId}` }]
    })
  })
});

export const {
  useGetDebtSummaryQuery,
  useGetDebtCustomersQuery,
  useGetDebtItemsByCustomerQuery
} = debtsApi;
