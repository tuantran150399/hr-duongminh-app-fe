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
    id            : String(job.id),
    backendId     : job.id,
    job_no        : job.jobCode || `JOB-${job.id}`,
    customer      : partnersById[job.partnerId]?.name || `Partner #${job.partnerId ?? '-'}`,
    status        : formatStatus(job.status),
    partnerId     : job.partnerId,
    branchId      : job.branchId,
    agentId       : job.agentId,
    assignedUserId: job.assignedUserId,
    cargoUnit: job.cargoUnit || null,
    cargoQuantity: job.cargoQuantity === null || job.cargoQuantity === undefined ? null : Number(job.cargoQuantity),
    weightKg: job.weightKg === null || job.weightKg === undefined ? null : Number(job.weightKg),
    volumeCbm: job.volumeCbm === null || job.volumeCbm === undefined ? null : Number(job.volumeCbm),
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
    id           : String(partner.id),
    backendId    : partner.id,
    code         : partner.code,
    name         : partner.name,
    partnerType  : partner.partnerType,
    type         : formatPartnerType(partner.partnerType),
    contactPerson: partner.contactPerson || '-',
    phone        : partner.phone || '-',
    email        : partner.email || '-',
    address      : partner.address || '-',
    taxCode      : partner.taxCode || '-',
    actualDebt   : 
      partner.actualDebt === null || partner.actualDebt === undefined
        ? 0
        : Number(partner.actualDebt),
    isActive: partner.isActive !== false,
    raw: partner
  };
}

export function normalizeEntry(entry) {
  if (!entry) return null;

  return {
    id               : String(entry.id),
    backendId        : entry.id,
    job_no           : entry.jobCode || entry.job?.jobCode || (entry.jobId ? `Job #${entry.jobId}` : '-'),
    jobId            : entry.jobId,
    jobIds           : entry.jobIds || (entry.jobId ? [entry.jobId] : []),
    vendorId         : entry.vendorId,
    description      : entry.description || '-',
    amount           : Number(entry.localAmount ?? entry.amount ?? 0),
    originalAmount   : Number(entry.amount ?? 0),
    exchangeRate     : Number(entry.exchangeRate ?? 1),
    status           : formatStatus(entry.status),
    paymentStatus    : formatStatus(entry.paymentStatus),
    paymentMethod    : entry.paymentMethod || null,
    paymentAccountRef: entry.paymentAccountRef || null,
    date             : entry.docDate || entry.createdAt || null,
    dueDate          : entry.dueDate || null,
    currency         : entry.currency || 'VND',
    raw              : entry
  };
}

export function normalizeDebtPolicy(policy) {
  if (!policy) return null;

  return {
    id           : String(policy.id),
    backendId    : policy.id,
    partnerId    : policy.partnerId,
    startDate    : policy.startDate || null,
    endDate      : policy.endDate || null,
    maxDebtAmount: 
      policy.maxDebtAmount === null || policy.maxDebtAmount === undefined
        ? null
        : Number(policy.maxDebtAmount),
    maxDebtAgeDays:
      policy.maxDebtAgeDays === null || policy.maxDebtAgeDays === undefined
        ? null
             :  Number(policy.maxDebtAgeDays),
    isActive : policy.isActive !== false,
    createdAt: policy.createdAt || null,
    updatedAt: policy.updatedAt || null,
    raw      : policy
  };
}

export const normalizeDebtSummary = (summary) => {
  if (!summary) return null;

  return {
    totalDebt      : summary.totalDebt      === null || summary.totalDebt      === undefined ? null : Number(summary.totalDebt),
    totalLimit     : summary.totalLimit     === null || summary.totalLimit     === undefined ? null : Number(summary.totalLimit),
    remainingLimit : summary.remainingLimit === null || summary.remainingLimit === undefined ? null : Number(summary.remainingLimit),
    overdueDebt    : summary.overdueDebt    === null || summary.overdueDebt    === undefined ? null : Number(summary.overdueDebt),
    raw            : summary
  };
};

export const normalizeDebtCustomer = (customer) => {
  if (!customer) return null;

  return {
    id          : String(customer.id),
    backendId   : customer.id,
    name        : customer.name        || '-',
    currentDebt : customer.currentDebt  === null || customer.currentDebt  === undefined ? null : Number(customer.currentDebt),
    creditLimit : customer.creditLimit  === null || customer.creditLimit  === undefined ? null : Number(customer.creditLimit),
    usagePercent: customer.usagePercent === null || customer.usagePercent === undefined ? null : Number(customer.usagePercent),
    status      : customer.status       || null,   // enum: normal | near_limit | over_limit | overdue
    raw         : customer
  };
};

export const normalizeDebtItem = (item) => {
  if (!item) return null;

  return {
    id         : String(item.id),
    backendId  : item.id,
    invoiceCode: item.invoiceCode || null,
    itemType   : item.itemType || 'RECEIVABLE',
    jobCode    : item.jobCode || null,
    description: item.description || null,
    amount     : item.amount === null || item.amount === undefined ? null : Number(item.amount),
    dueDate    : item.dueDate    || null,
    isOverdue  : Boolean(item.isOverdue),
    raw        : item
  };
};

export function normalizeUser(user) {
  if (!user) return null;

  const blockedAt        = user.blockedAt || user.blocked_at || null;
  const blockedUntil     = user.blockedUntil || user.blocked_until || null;
  const now              = Date.now();
  const blockedUntilTime = blockedUntil ? new Date(blockedUntil).getTime() : null;
  const isBlocked        = Boolean(blockedAt) && (!blockedUntilTime || blockedUntilTime > now);

  return {
    id       : String(user.id),
    backendId: user.id,
    username : user.username,
    email    : user.email,
    fullName : user.fullName || user.full_name || user.username,
    branchId : user.branchId,
    isActive : user.isActive !== false,
    blockedAt,
    blockedUntil,
    blockedReason: user.blockedReason || user.blocked_reason || null,
    blockedBy    : user.blockedBy || user.blocked_by || null,
    unblockedAt  : user.unblockedAt || user.unblocked_at || null,
    unblockedBy  : user.unblockedBy || user.unblocked_by || null,
    isBlocked,
    roles     : user.roles || [],
    roleNames : (user.roles || []).map((role) => role.name || role).filter(Boolean),
    raw       : user
  };
}

export function normalizeRole(role) {
  if (!role) return null;

  return {
    id         : String(role.id),
    backendId  : role.id,
    name       : role.name,
    description: role.description || '-',
    permissions: role.permissions || [],
    raw        : role
  };
}

export function normalizeBranch(branch) {
  if (!branch) return null;

  return {
    id       : String(branch.id),
    backendId: branch.id,
    code     : branch.code,
    name     : branch.name,
    address  : branch.address || '-',
    isActive : branch.isActive !== false,
    raw      : branch
  };
}

export function normalizeAuditLog(log) {
  if (!log) return null;

  return {
    id        : String(log.id),
    backendId : log.id,
    entityName: log.entityName || log.entity_name || '-',
    entityId  : log.entityId || log.entity_id || '-',
    action    : log.action || '-',
    userId    : log.userId || log.user_id || '-',
    actor     : log.actor || null,
    entity    : log.entity || null,
    oldValues : log.oldValues || log.old_values || null,
    newValues : log.newValues || log.new_values || null,
    ipAddress : log.ipAddress || log.ip_address || '-',
    userAgent : log.userAgent || log.user_agent || '-',
    createdAt : log.createdAt || log.created_at || null,
    raw       : log
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
