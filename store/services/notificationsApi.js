import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems } from '@/utils/apiMappers';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        method: 'GET',
        params: { page: 1, limit: 30, ...params }
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return {
          items: items.map((n) => ({
            id: String(n.id),
            backendId: n.id,
            type: n.type || 'INFO',
            title: n.title || '',
            message: n.message || n.body || '',
            entityType: n.entityType || null,
            entityId: n.entityId || null,
            eventRef: n.eventRef || null,
            actionUrl: n.actionUrl || null,
            actionLabel: n.actionLabel || null,
            priority: n.priority || 'normal',
            readAt: n.readAt || null,
            isRead: Boolean(n.isRead ?? n.read),
            createdAt: n.createdAt || n.created_at || null,
            raw: n
          })),
          meta
        };
      },
      providesTags: ['Notification']
    }),

    getUnreadCount: builder.query({
      query: () => ({ url: '/notifications/unread-count', method: 'GET' }),
      providesTags: ['Notification']
    }),

    markAsRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification']
    }),

    markAllAsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification']
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification']
    }),

    // History/timeline for a specific entity (e.g. a job, advance, debit note)
    getEntityHistory: builder.query({
      query: ({ entityType, entityId }) => ({
        url: `/notifications/entity/${entityType}/${entityId}`,
        method: 'GET'
      }),
      transformResponse: (response) => {
        const items = Array.isArray(response) ? response : (response?.items ?? []);
        return items.map((n) => ({
          id: String(n.id),
          backendId: n.id,
          type: n.type || 'INFO',
          title: n.title || '',
          message: n.message || '',
          entityType: n.entityType || null,
          entityId: n.entityId || null,
          isRead: Boolean(n.isRead ?? n.read),
          createdAt: n.createdAt || n.created_at || null
        }));
      },
      providesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetEntityHistoryQuery
} = notificationsApi;
