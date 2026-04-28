import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

/**
 * Partners API slice — RTK Query
 *
 * TODO: Cập nhật endpoint URL khi backend sẵn sàng.
 *
 * Hooks được sinh tự động:
 *   useGetPartnersQuery(params?)       — danh sách partners
 *   useGetPartnerByIdQuery(id)         — chi tiết 1 partner
 *   useCreatePartnerMutation()         — tạo partner mới
 *   useUpdatePartnerMutation()         — cập nhật partner
 *   useDeletePartnerMutation()         — xoá partner
 */
export const partnersApi = createApi({
  reducerPath: 'partnersApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Partner'],
  endpoints: (builder) => ({
    getPartners: builder.query({
      query: (params = { page: 1, limit: 100 }) => ({
        url: '/partners',
        method: 'GET',
        params
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Partner', id })),
              { type: 'Partner', id: 'LIST' }
            ]
          : [{ type: 'Partner', id: 'LIST' }]
    }),

    getPartnerById: builder.query({
      query: (id) => ({ url: `/partners/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Partner', id }]
    }),

    createPartner: builder.mutation({
      query: (body) => ({ url: '/partners', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Partner', id: 'LIST' }]
    }),

    updatePartner: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/partners/${id}`,
        method: 'PUT',
        data: body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Partner', id },
        { type: 'Partner', id: 'LIST' }
      ]
    }),

    deletePartner: builder.mutation({
      query: (id) => ({ url: `/partners/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Partner', id: 'LIST' }]
    })
  })
});

export const {
  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation
} = partnersApi;
