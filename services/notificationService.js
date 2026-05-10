import api from '@/services/api';

export async function getNotifications(params = {}) {
  const response = await api.get('/notifications', { params: { page: 1, limit: 30, ...params } });
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  return response.data;
}

export async function markAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllAsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data;
}

export async function deleteNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}

export async function exportJobs(params = {}) {
  const response = await api.post('/jobs/export', params, { responseType: 'blob' });
  return response.data;
}
