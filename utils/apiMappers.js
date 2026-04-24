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
    type: formatPartnerType(partner.partnerType),
    phone: partner.phone || '-',
    email: partner.email || '-',
    raw: partner
  };
}

export function normalizeEntry(entry) {
  if (!entry) return null;

  return {
    id: String(entry.id),
    backendId: entry.id,
    description: entry.description || '-',
    amount: Number(entry.localAmount ?? entry.amount ?? 0),
    originalAmount: Number(entry.amount ?? 0),
    status: formatStatus(entry.status),
    paymentStatus: formatStatus(entry.paymentStatus),
    date: entry.docDate || entry.createdAt || null,
    currency: entry.currency || 'VND',
    raw: entry
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
