import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/store/axiosBaseQuery';
import { extractPaginatedItems, formatStatus } from '@/utils/apiMappers';

function normalizeLoginEvent(item) {
  return {
    id: String(item.id),
    backendId: item.id,
    userId: item.userId ?? item.user_id ?? null,
    username: item.username || '-',
    status: item.status || '-',
    ipAddress: item.ipAddress || item.ip_address || '-',
    userAgent: item.userAgent || item.user_agent || '-',
    deviceFingerprint: item.deviceFingerprint || item.device_fingerprint || '-',
    countryCode: item.countryCode || item.country_code || '-',
    locationLabel: item.locationLabel || item.location_label || '-',
    failureReason: item.failureReason || item.failure_reason || '-',
    riskScore: Number(item.riskScore ?? item.risk_score ?? 0),
    signals: item.signals || null,
    createdAt: item.createdAt || item.created_at || null,
    raw: item,
  };
}

function normalizeSecurityAlert(item) {
  return {
    id: String(item.id),
    backendId: item.id,
    userId: item.userId ?? item.user_id ?? null,
    username: item.username || '-',
    type: item.type || '-',
    severity: item.severity || '-',
    status: item.status || '-',
    title: item.title || '-',
    message: item.message || '-',
    ipAddress: item.ipAddress || item.ip_address || '-',
    userAgent: item.userAgent || item.user_agent || '-',
    countryCode: item.countryCode || item.country_code || '-',
    metadata: item.metadata || null,
    resolvedAt: item.resolvedAt || item.resolved_at || null,
    resolvedBy: item.resolvedBy || item.resolved_by || null,
    createdAt: item.createdAt || item.created_at || null,
    raw: item,
  };
}

function normalizeIpRule(item) {
  return {
    id: String(item.id),
    backendId: item.id,
    type: item.type || '-',
    typeLabel: formatStatus(item.type),
    ipPattern: item.ipPattern || item.ip_pattern || '-',
    label: item.label || '-',
    description: item.description || '-',
    isActive: Boolean(item.isActive ?? item.is_active),
    createdAt: item.createdAt || item.created_at || null,
    raw: item,
  };
}

export const securityApi = createApi({
  reducerPath: 'securityApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SecurityAlert', 'SecurityLoginEvent', 'IpAccessRule'],
  endpoints: (builder) => ({
    getLoginEvents: builder.query({
      query: (params = {}) => ({
        url: '/security/login-events',
        method: 'GET',
        params: { page: 1, limit: 30, ...params },
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeLoginEvent), meta };
      },
      providesTags: ['SecurityLoginEvent'],
    }),

    getSecurityAlerts: builder.query({
      query: (params = {}) => ({
        url: '/security/alerts',
        method: 'GET',
        params: { page: 1, limit: 30, ...params },
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeSecurityAlert), meta };
      },
      providesTags: ['SecurityAlert'],
    }),

    updateSecurityAlertStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/security/alerts/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: ['SecurityAlert'],
    }),

    getIpRules: builder.query({
      query: (params = {}) => ({
        url: '/security/ip-rules',
        method: 'GET',
        params: { page: 1, limit: 50, ...params },
      }),
      transformResponse: (response) => {
        const { items, meta } = extractPaginatedItems(response);
        return { items: items.map(normalizeIpRule), meta };
      },
      providesTags: ['IpAccessRule'],
    }),

    createIpRule: builder.mutation({
      query: (payload) => ({
        url: '/security/ip-rules',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['IpAccessRule'],
    }),

    updateIpRule: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/security/ip-rules/${id}`,
        method: 'PATCH',
        data: payload,
      }),
      invalidatesTags: ['IpAccessRule'],
    }),

    deleteIpRule: builder.mutation({
      query: (id) => ({
        url: `/security/ip-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['IpAccessRule'],
    }),
  }),
});

export const {
  useGetLoginEventsQuery,
  useGetSecurityAlertsQuery,
  useUpdateSecurityAlertStatusMutation,
  useGetIpRulesQuery,
  useCreateIpRuleMutation,
  useUpdateIpRuleMutation,
  useDeleteIpRuleMutation,
} = securityApi;
