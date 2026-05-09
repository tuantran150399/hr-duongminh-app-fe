import api from '@/services/api';

// ─── Employees ────────────────────────────────────────────────────────────────

export async function getEmployees(params = {}) {
  const response = await api.get('/hr/employees', { params: { page: 1, limit: 100, ...params } });
  const data = response.data;
  const items = data?.data ?? data?.items ?? (Array.isArray(data) ? data : []);
  return { items };
}

export async function createEmployee(payload) {
  const response = await api.post('/hr/employees', payload);
  return response.data;
}

export async function updateEmployee(id, payload) {
  const response = await api.patch(`/hr/employees/${id}`, payload);
  return response.data;
}

// ─── Timekeeping / Attendance ─────────────────────────────────────────────────

export async function getAttendance(params = {}) {
  const response = await api.get('/hrm/attendance', { params: { page: 1, limit: 100, ...params } });
  const data = response.data;
  const items = data?.data?.items ?? data?.items ?? (Array.isArray(data) ? data : []);
  return { items };
}

export async function createAttendance(payload) {
  const response = await api.post('/hrm/attendance', payload);
  return response.data;
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export async function getLeaveRequests(params = {}) {
  const response = await api.get('/hrm/leaves', { params: { page: 1, limit: 100, ...params } });
  const data = response.data;
  const items = data?.data?.items ?? data?.items ?? (Array.isArray(data) ? data : []);
  return { items };
}

export async function createLeaveRequest(payload) {
  const response = await api.post('/hrm/leaves', payload);
  return response.data;
}

export async function approveLeaveRequest(id) {
  const response = await api.patch(`/hrm/leaves/${id}/approve`);
  return response.data;
}

export async function rejectLeaveRequest(id, reason) {
  const response = await api.patch(`/hrm/leaves/${id}/reject`, { reason });
  return response.data;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export async function getPayroll(params = {}) {
  const response = await api.get('/hrm/payroll', { params: { page: 1, limit: 100, ...params } });
  const data = response.data;
  const items = data?.data?.items ?? data?.items ?? (Array.isArray(data) ? data : []);
  return { items };
}

export async function createPayrollRecord(payload) {
  const response = await api.post('/hrm/payroll', payload);
  return response.data;
}

export async function finalizePayroll(id) {
  const response = await api.patch(`/hrm/payroll/${id}/finalize`);
  return response.data;
}
