import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import {
  extractPaginatedItems,
  normalizeDebtSummary,
  normalizeDebtCustomer,
  normalizeDebtItem
} from '@/utils/apiMappers';
import {
  mockDebtSummary,
  mockDebtCustomers,
  mockDebtDetailByCustomer
} from './__mocks__/debtsMock';

// Đặt thành false khi backend sẵn sàng
const USE_MOCK = true;

export const debtsApi = createApi({
  reducerPath: 'debtsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['DebtSummary', 'DebtCustomer', 'DebtItem'],

  endpoints: (builder) => ({

    // ── Tổng hợp công nợ ────────────────────────────────────────────────────
    getDebtSummary: builder.query({
      ...(USE_MOCK
        ? {
            queryFn: () => ({
              data: normalizeDebtSummary(mockDebtSummary)
            })
          }
        : {
            query: () => ({ url: '/debts/summary', method: 'GET' }),
            transformResponse: (response) => normalizeDebtSummary(response)
          }
      ),
      providesTags: [{ type: 'DebtSummary', id: 'SUMMARY' }]
    }),

    // ── Danh sách khách hàng công nợ ────────────────────────────────────────
    // params: { status?: 'normal' | 'near_limit' | 'over_limit' | 'overdue' }
    getDebtCustomers: builder.query({
      ...(USE_MOCK
        ? {
            queryFn: (params = {}) => {
              const { status } = params;
              const filtered = status
                ? mockDebtCustomers.filter((c) => c.status === status)
                : mockDebtCustomers;
              return {
                data: {
                  items: filtered.map(normalizeDebtCustomer).filter(Boolean),
                  meta : null
                }
              };
            }
          }
        : {
            query: (params = {}) => ({
              url   : '/debts/customers',
              method: 'GET',
              params: { page: 1, limit: 50, ...params }
            }),
            transformResponse: (response) => {
              const { items, meta } = extractPaginatedItems(response);
              return { items: items.map(normalizeDebtCustomer).filter(Boolean), meta };
            }
          }
      ),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'DebtCustomer', id })),
              { type: 'DebtCustomer', id: 'LIST' }
            ]
          : [{ type: 'DebtCustomer', id: 'LIST' }]
    }),

    // ── Chi tiết khoản nợ theo khách hàng ───────────────────────────────────
    // arg: customerId (number | string)
    getDebtItemsByCustomer: builder.query({
      ...(USE_MOCK
        ? {
            queryFn: (customerId) => {
              const raw = mockDebtDetailByCustomer[customerId] ?? [];
              return {
                data: {
                  items: raw.map(normalizeDebtItem).filter(Boolean),
                  meta : null
                }
              };
            }
          }
        : {
            query: (customerId) => ({
              url   : `/debts/customers/${customerId}/items`,
              method: 'GET'
            }),
            transformResponse: (response) => {
              const { items, meta } = extractPaginatedItems(response);
              return { items: items.map(normalizeDebtItem).filter(Boolean), meta };
            }
          }
      ),
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
