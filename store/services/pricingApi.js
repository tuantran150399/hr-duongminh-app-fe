import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems } from '@/utils/apiMappers';

export const pricingApi = createApi({
  reducerPath: 'pricingApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Pricing'],
  endpoints: (builder) => ({
    getServicePrices: builder.query({
      query: (params = {}) => ({
        url: '/pricing',
        method: 'GET',
        params: { page: 1, limit: 100, ...params }
      }),
      transformResponse: (response) => extractPaginatedItems(response),
      providesTags: (result) =>
        result?.items
          ? [
            ...result.items.map(({ id }) => ({ type: 'Pricing', id })),
            { type: 'Pricing', id: 'LIST' }
          ]
          : [{ type: 'Pricing', id: 'LIST' }]
    }),

    createServicePrice: builder.mutation({
      query: (payload) => ({ url: '/pricing', method: 'POST', data: payload }),
      invalidatesTags: [{ type: 'Pricing', id: 'LIST' }]
    }),

    importServicePrices: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: '/pricing/import', method: 'POST', data: formData };
      },
      invalidatesTags: [{ type: 'Pricing', id: 'LIST' }]
    }),

    // Lookup applicable tariffs for a given customer/job combination.
    // Backend matches by partnerId, serviceType, route, effectivity dates.
    // Falls back to general tariffs (partnerId=null) if no customer-specific ones exist.
    lookupPricing: builder.query({
      query: ({ partnerId, jobId } = {}) => ({
        url: '/pricing/lookup',
        method: 'GET',
        params: { partnerId, jobId }
      }),
      transformResponse: (response) => {
        const { items } = extractPaginatedItems(response);
        return items || [];
      },
      providesTags: [{ type: 'Pricing', id: 'LOOKUP' }]
    }),

    updateServicePrice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/pricing/${id}`,
        method: 'PUT',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Pricing', id },
        { type: 'Pricing', id: 'LIST' }
      ]
    }),

    deleteServicePrice: builder.mutation({
      query: (id) => ({ url: `/pricing/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Pricing', id: 'LIST' }]
    })
  })
});

export const {
  useGetServicePricesQuery,
  useCreateServicePriceMutation,
  useImportServicePricesMutation,
  useLookupPricingQuery,
  useUpdateServicePriceMutation,
  useDeleteServicePriceMutation
} = pricingApi;
