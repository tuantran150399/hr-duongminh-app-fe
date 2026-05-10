import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, normalizeEntry } from '@/utils/apiMappers';

export const cobApi = createApi({
  reducerPath: 'cobApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['COB'],
  endpoints: (builder) => ({
    // ── Charge-on-behalf entries (we pay vendor, customer reimburses us) ──────
    getCobEntries: builder.query({
      query: (params = {}) => ({
        url: '/accounting/cob',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeEntry).filter(Boolean), meta };
      },
      providesTags: ['COB']
    }),

    createCobEntry: builder.mutation({
      query: (payload) => ({
        url: '/accounting/cob',
        method: 'POST',
        data: payload
      }),
      invalidatesTags: ['COB']
    }),

    // Auto-link: when a cost entry is flagged as "charge-on-behalf", backend
    // auto-creates a matching receivable. This endpoint marks an existing cost
    // as COB and triggers the auto-receivable creation.
    markCostAsCob: builder.mutation({
      query: ({ costId, partnerId }) => ({
        url: `/accounting/cost/${costId}/charge-on-behalf`,
        method: 'POST',
        data: { partnerId }
      }),
      invalidatesTags: ['COB']
    }),

    // Settle / acknowledge a COB receivable once customer pays
    settleCobEntry: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/cob/${id}/settle`,
        method: 'PATCH',
        data: body
      }),
      invalidatesTags: ['COB']
    }),

    // ── Collect-on-behalf entries (we collect from customer for vendor) ───────
    getCollectOnBehalfEntries: builder.query({
      query: (params = {}) => ({
        url: '/accounting/collect-on-behalf',
        method: 'GET',
        params: { page: 1, limit: 50, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeEntry).filter(Boolean), meta };
      },
      providesTags: ['COB']
    }),

    createCollectOnBehalfEntry: builder.mutation({
      query: (payload) => ({
        url: '/accounting/collect-on-behalf',
        method: 'POST',
        data: payload
      }),
      invalidatesTags: ['COB']
    }),

    settleCollectOnBehalf: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/collect-on-behalf/${id}/settle`,
        method: 'PATCH',
        data: body
      }),
      invalidatesTags: ['COB']
    })
  })
});

export const {
  useGetCobEntriesQuery,
  useCreateCobEntryMutation,
  useMarkCostAsCobMutation,
  useSettleCobEntryMutation,
  useGetCollectOnBehalfEntriesQuery,
  useCreateCollectOnBehalfEntryMutation,
  useSettleCollectOnBehalfMutation
} = cobApi;
