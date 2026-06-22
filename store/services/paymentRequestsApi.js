import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export const paymentRequestsApi = createApi({
  reducerPath: 'paymentRequestsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['PaymentRequest'],
  endpoints: (builder) => ({
    getPaymentRequests: builder.query({
      query: (params = {}) => ({
        url: '/payment-requests',
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
            ...result.items.map(({ id }) => ({ type: 'PaymentRequest', id })),
            { type: 'PaymentRequest', id: 'LIST' }
          ]
          : [{ type: 'PaymentRequest', id: 'LIST' }]
    }),

    getPaymentRequestById: builder.query({
      query: (id) => ({ url: `/payment-requests/${id}`, method: 'GET' }),
      transformResponse: (response) => normalizeEntry(response),
      providesTags: (_result, _error, id) => [{ type: 'PaymentRequest', id }]
    }),

    createPaymentRequest: builder.mutation({
      query: (payload) => ({ url: '/payment-requests', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'PaymentRequest', id: 'LIST' }]
    }),

    approvePaymentRequest: builder.mutation({
      query: ({ id, comment }) => ({ url: `/payment-requests/${id}/approve`, method: 'PATCH', data: { comment } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequest', id: 'LIST' }
      ]
    }),

    finalApprovePaymentRequest: builder.mutation({
      query: ({ id, comment }) => ({ url: `/payment-requests/${id}/final-approve`, method: 'PATCH', data: { comment } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequest', id: 'LIST' }
      ]
    }),

    rejectPaymentRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/payment-requests/${id}/reject`,
        method: 'PATCH',
        data: { reason }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequest', id: 'LIST' }
      ]
    }),

    markPaymentRequestPaid: builder.mutation({
      query: (id) => ({ url: `/payment-requests/${id}/mark-paid`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequest', id: 'LIST' }
      ]
    }),

    updatePaymentRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-requests/${id}`,
        method: 'PUT',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequest', id: 'LIST' }
      ]
    }),

    deletePaymentRequest: builder.mutation({
      query: (id) => ({ url: `/payment-requests/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'PaymentRequest', id: 'LIST' }]
    })
  })
});

export const {
  useGetPaymentRequestsQuery,
  useGetPaymentRequestByIdQuery,
  useCreatePaymentRequestMutation,
  useApprovePaymentRequestMutation,
  useFinalApprovePaymentRequestMutation,
  useRejectPaymentRequestMutation,
  useMarkPaymentRequestPaidMutation,
  useUpdatePaymentRequestMutation,
  useDeletePaymentRequestMutation
} = paymentRequestsApi;
