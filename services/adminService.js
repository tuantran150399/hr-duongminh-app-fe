import api from '@/services/api';
import {
  extractPaginatedItems,
  normalizeAuditLog,
  normalizeBranch,
  normalizeRole,
  normalizeUser
} from '@/utils/apiMappers';

export async function getUsers() {
  const response = await api.get('/users');
  const { items } = extractPaginatedItems(response.data);
  return (items.length ? items : Array.isArray(response.data) ? response.data : [])
    .map(normalizeUser)
    .filter(Boolean);
}

export async function createUser(payload) {
  const response = await api.post('/users', payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

export async function getRoles() {
  const response = await api.get('/roles');
  const { items } = extractPaginatedItems(response.data);
  return (items.length ? items : Array.isArray(response.data) ? response.data : [])
    .map(normalizeRole)
    .filter(Boolean);
}

export async function getPermissions() {
  const response = await api.get('/roles/permissions');
  const { items } = extractPaginatedItems(response.data);
  return items.length ? items : Array.isArray(response.data) ? response.data : [];
}

export async function createRole(payload) {
  const response = await api.post('/roles', payload);
  return response.data;
}

export async function updateRole(id, payload) {
  const response = await api.patch(`/roles/${id}`, payload);
  return response.data;
}

export async function getBranches() {
  const response = await api.get('/branches');
  const { items } = extractPaginatedItems(response.data);
  return (items.length ? items : Array.isArray(response.data) ? response.data : [])
    .map(normalizeBranch)
    .filter(Boolean);
}

export async function createBranch(payload) {
  const response = await api.post('/branches', payload);
  return response.data;
}

export async function updateBranch(id, payload) {
  const response = await api.patch(`/branches/${id}`, payload);
  return response.data;
}

export async function getAuditLogs(params = {}) {
  const response = await api.get('/audit-logs', {
    params: { page: 1, limit: 50, ...params }
  });
  const { items, meta } = extractPaginatedItems(response.data);
  return {
    items: items.map(normalizeAuditLog).filter(Boolean),
    meta
  };
}
