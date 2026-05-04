export function extractPaginatedItems(payload) {
  if (Array.isArray(payload)) {
    return { items: payload, meta: null };
  }

  if (Array.isArray(payload?.data)) {
    return { items: payload.data, meta: payload.meta || null };
  }

  if (Array.isArray(payload?.items)) {
    return { items: payload.items, meta: payload.meta || null };
  }

  return { items: [], meta: null };
}

export function normalizeJob(job, partnersById = {}) {
  if (!job) return null;

  return {
    id: String(job.id),
    backendId: job.id,
    job_no: job.jobCode || `JOB-${job.id}`,
    customer: partnersById[job.partnerId]?.name || `Partner #${job.partnerId ?? '-'}`,
    status: formatStatus(job.status),
    partnerId: job.partnerId,
    branchId: job.branchId,
    agentId: job.agentId,
    assignedUserId: job.assignedUserId,
    origin: job.origin || job.pol || '-',
    destination: job.destination || job.pod || '-',
    etd: job.etd || null,
    eta: job.eta || null,
    raw: job
  };
}

export function normalizePartner(partner) {
  if (!partner) return null;

  return {
    id: String(partner.id),
    backendId: partner.id,
    code: partner.code,
    name: partner.name,
    partnerType: partner.partnerType,
    type: formatPartnerType(partner.partnerType),
    contactPerson: partner.contactPerson || '-',
    phone: partner.phone || '-',
    email: partner.email || '-',
    address: partner.address || '-',
    taxCode: partner.taxCode || '-',
    isActive: partner.isActive !== false,
    raw: partner
  };
}

export function normalizeEntry(entry) {
  if (!entry) return null;

  return {
    id: String(entry.id),
    backendId: entry.id,
    job_no: entry.jobCode || entry.job?.jobCode || `Job #${entry.jobId ?? '-'}`,
    jobId: entry.jobId,
    vendorId: entry.vendorId,
    description: entry.description || '-',
    amount: Number(entry.localAmount ?? entry.amount ?? 0),
    originalAmount: Number(entry.amount ?? 0),
    exchangeRate: Number(entry.exchangeRate ?? 1),
    status: formatStatus(entry.status),
    paymentStatus: formatStatus(entry.paymentStatus),
    date: entry.docDate || entry.createdAt || null,
    dueDate: entry.dueDate || null,
    currency: entry.currency || 'VND',
    raw: entry
  };
}

export function normalizeUser(user) {
  if (!user) return null;

  return {
    id: String(user.id),
    backendId: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName || user.full_name || user.username,
    branchId: user.branchId,
    isActive: user.isActive !== false,
    roles: user.roles || [],
    roleNames: (user.roles || []).map((role) => role.name || role).filter(Boolean),
    raw: user
  };
}

export function normalizeRole(role) {
  if (!role) return null;

  return {
    id: String(role.id),
    backendId: role.id,
    name: role.name,
    description: role.description || '-',
    permissions: role.permissions || [],
    raw: role
  };
}

export function normalizeBranch(branch) {
  if (!branch) return null;

  return {
    id: String(branch.id),
    backendId: branch.id,
    code: branch.code,
    name: branch.name,
    address: branch.address || '-',
    isActive: branch.isActive !== false,
    raw: branch
  };
}

export function normalizeAuditLog(log) {
  if (!log) return null;

  return {
    id: String(log.id),
    backendId: log.id,
    entityName: log.entityName || log.entity_name || '-',
    entityId: log.entityId || log.entity_id || '-',
    action: log.action || '-',
    userId: log.userId || log.user_id || '-',
    oldValues: log.oldValues || log.old_values || null,
    newValues: log.newValues || log.new_values || null,
    ipAddress: log.ipAddress || log.ip_address || '-',
    userAgent: log.userAgent || log.user_agent || '-',
    createdAt: log.createdAt || log.created_at || null,
    raw: log
  };
}

export function formatStatus(value) {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPartnerType(value) {
  if (!value) return '-';
  if (value === 'BOTH') return 'Customer/Vendor';
  return formatStatus(value);
}
