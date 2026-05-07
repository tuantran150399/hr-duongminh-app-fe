import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials
      })
    }),

    getMe: builder.query({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: [{ type: 'Auth', id: 'ME' }]
    }),

    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: [{ type: 'Auth', id: 'ME' }]
    }),

    changePassword: builder.mutation({
      query: (data) => ({ url: '/change-password', method: 'POST', data }),
      invalidatesTags: [{ type: 'Auth', id: 'ME' }]
    })
  })
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useChangePasswordMutation
} = authApi;
