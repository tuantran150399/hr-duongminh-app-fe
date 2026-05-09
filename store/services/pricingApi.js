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
    })
  })
});

export const {
  useGetServicePricesQuery,
  useCreateServicePriceMutation,
  useImportServicePricesMutation
} = pricingApi;
