import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export const debitNotesApi = createApi({
  reducerPath: 'debitNotesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['DebitNote', 'DebitCobCandidates'],
  endpoints: (builder) => ({
    getDebitNotes: builder.query({
      query: (params = {}) => ({
        url: '/debit-notes',
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
            ...result.items.map(({ id }) => ({ type: 'DebitNote', id })),
            { type: 'DebitNote', id: 'LIST' }
          ]
          : [{ type: 'DebitNote', id: 'LIST' }]
    }),

    getDebitNoteById: builder.query({
      query: (id) => ({ url: `/debit-notes/${id}`, method: 'GET' }),
      transformResponse: (response) => normalizeEntry(response),
      providesTags: (_result, _error, id) => [{ type: 'DebitNote', id }]
    }),

    getDebitCobCandidates: builder.query({
      query: ({ partnerId, jobIds, debitNoteId }) => ({
        url: '/debit-notes/cob-candidates',
        method: 'GET',
        params: {
          partnerId,
          jobIds: (jobIds || []).join(','),
          debitNoteId: debitNoteId || undefined
        }
      }),
      providesTags: ['DebitCobCandidates']
    }),

    previewDebitDebt: builder.mutation({
      query: (payload) => ({ url: '/debit-notes/debt-preview', method: 'POST', data: payload })
    }),

    createDebitNote: builder.mutation({
      query: (payload) => ({ url: '/debit-notes', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'DebitNote', id: 'LIST' }, 'DebitCobCandidates']
    }),

    updateDebitNote: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/debit-notes/${id}`,
        method: 'PUT',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DebitNote', id },
        { type: 'DebitNote', id: 'LIST' },
        'DebitCobCandidates'
      ]
    }),

    postDebitNote: builder.mutation({
      query: (id) => ({ url: `/debit-notes/${id}/post`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DebitNote', id },
        { type: 'DebitNote', id: 'LIST' }
      ]
    }),

    voidDebitNote: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/debit-notes/${id}/void`,
        method: 'POST',
        data: { reason }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DebitNote', id },
        { type: 'DebitNote', id: 'LIST' },
        'DebitCobCandidates'
      ]
    }),

    sendDebitNote: builder.mutation({
      query: (id) => ({ url: `/debit-notes/${id}/send`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DebitNote', id },
        { type: 'DebitNote', id: 'LIST' }
      ]
    }),

    recordDebitNotePayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/debit-notes/${id}/record-payment`,
        method: 'PATCH',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DebitNote', id },
        { type: 'DebitNote', id: 'LIST' }
      ]
    }),

    exportDebitNote: builder.mutation({
      query: ({ id, format }) => ({
        url: `/debit-notes/${id}/export/${format}`,
        method: 'GET',
        responseType: 'blob'
      })
    }),

    deleteDebitNote: builder.mutation({
      query: (id) => ({ url: `/debit-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'DebitNote', id: 'LIST' }]
    })
  })
});

export const {
  useGetDebitNotesQuery,
  useGetDebitNoteByIdQuery,
  useLazyGetDebitNoteByIdQuery,
  useGetDebitCobCandidatesQuery,
  usePreviewDebitDebtMutation,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  usePostDebitNoteMutation,
  useVoidDebitNoteMutation,
  useSendDebitNoteMutation,
  useRecordDebitNotePaymentMutation,
  useExportDebitNoteMutation,
  useDeleteDebitNoteMutation
} = debitNotesApi;
