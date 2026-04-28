export const DEMO_TOKEN = 'demo-local-jwt-token';

export const mockUser = {
  id: 1,
  username: 'admin',
  fullName: 'Demo Administrator',
  email: 'admin@duongminhvn.com',
  roles: ['SUPER_ADMIN'],
  permissions: ['*']
};

export const mockPartners = [
  {
    id: 1,
    code: 'KH001',
    name: 'Minh Long Trading',
    partnerType: 'CUSTOMER',
    phone: '0901 234 501',
    email: 'ops@minhlong.vn'
  },
  {
    id: 2,
    code: 'KH002',
    name: 'Blue Ocean Foods',
    partnerType: 'CUSTOMER',
    phone: '0901 234 502',
    email: 'logistics@blueocean.vn'
  },
  {
    id: 3,
    code: 'KH003',
    name: 'An Phat Manufacturing',
    partnerType: 'CUSTOMER',
    phone: '0901 234 503',
    email: 'supplychain@anphat.vn'
  },
  {
    id: 4,
    code: 'NCC001',
    name: 'Evergreen Marine',
    partnerType: 'VENDOR',
    phone: '0283 888 1001',
    email: 'agent@evergreen.vn'
  },
  {
    id: 5,
    code: 'NCC002',
    name: 'Tan Cang Customs',
    partnerType: 'VENDOR',
    phone: '0283 888 1002',
    email: 'customs@tancang.vn'
  }
];

export const mockJobs = [
  {
    id: 1,
    jobCode: 'JOB-2026-001',
    status: 'IN_PROGRESS',
    jobType: 'IMPORT',
    shipmentMode: 'SEA_FCL',
    partnerId: 1,
    branchId: 1,
    assignedUserId: 1,
    origin: 'Ho Chi Minh',
    destination: 'Da Nang',
    pol: 'Cat Lai',
    pod: 'Tien Sa',
    etd: '2026-04-18',
    eta: '2026-04-20',
    bookingRef: 'BK-001',
    vesselName: 'EVER BRIGHT',
    voyageNo: 'EB001W',
    containerNo: 'CONT-001',
    shipperName: 'Minh Long Trading',
    consigneeName: 'Da Nang Retail Hub',
    agentName: 'Evergreen Marine',
    salespersonName: 'Nguyen Van A',
    businessType: 'Trading',
    customsChannel: 'Green',
    coType: 'Form D',
    cargoType: 'FCL',
    createdAt: '2026-04-17T08:00:00.000Z'
  },
  {
    id: 2,
    jobCode: 'JOB-2026-002',
    status: 'CLOSED',
    jobType: 'EXPORT',
    shipmentMode: 'SEA_LCL',
    partnerId: 2,
    branchId: 1,
    assignedUserId: 1,
    origin: 'Hai Phong',
    destination: 'Singapore',
    pol: 'Hai Phong Port',
    pod: 'PSA',
    etd: '2026-04-08',
    eta: '2026-04-10',
    bookingRef: 'BK-002',
    vesselName: 'OCEAN STAR',
    voyageNo: 'OS889E',
    containerNo: 'CONT-002',
    shipperName: 'Blue Ocean Foods',
    consigneeName: 'Singapore Cold Storage',
    agentName: 'Evergreen Marine',
    salespersonName: 'Tran Thi B',
    businessType: 'Food Export',
    customsChannel: 'Yellow',
    coType: 'Form E',
    cargoType: 'LCL',
    createdAt: '2026-04-07T09:30:00.000Z'
  },
  {
    id: 3,
    jobCode: 'JOB-2026-003',
    status: 'DRAFT',
    jobType: 'DOMESTIC',
    shipmentMode: 'ROAD',
    partnerId: 3,
    branchId: 2,
    assignedUserId: 1,
    origin: 'Binh Duong',
    destination: 'Bangkok',
    pol: 'Binh Duong ICD',
    pod: 'Laem Chabang',
    etd: '2026-04-21',
    eta: '2026-04-22',
    bookingRef: 'BK-003',
    vesselName: 'ASIA CONNECT',
    voyageNo: 'AC220',
    containerNo: 'CONT-003',
    shipperName: 'An Phat Manufacturing',
    consigneeName: 'Bangkok Distribution Center',
    agentName: 'Tan Cang Customs',
    salespersonName: 'Le Minh C',
    businessType: 'Manufacturing',
    customsChannel: 'Red',
    coType: 'Form AK',
    cargoType: 'Road',
    createdAt: '2026-04-20T11:00:00.000Z'
  }
];

export const mockRevenueEntries = [
  {
    id: 101,
    jobId: 1,
    description: 'Ocean freight invoice',
    currency: 'USD',
    amount: 3200,
    localAmount: 3200,
    status: 'POSTED',
    paymentStatus: 'ISSUED',
    docDate: '2026-04-20',
    createdAt: '2026-04-20T10:00:00.000Z'
  },
  {
    id: 102,
    jobId: 2,
    description: 'Export handling invoice',
    currency: 'USD',
    amount: 5800,
    localAmount: 5800,
    status: 'POSTED',
    paymentStatus: 'PAID',
    docDate: '2026-04-10',
    createdAt: '2026-04-10T10:00:00.000Z'
  },
  {
    id: 103,
    jobId: 3,
    description: 'Draft customer receivable',
    currency: 'USD',
    amount: 2100,
    localAmount: 2100,
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    docDate: '2026-04-22',
    createdAt: '2026-04-22T10:00:00.000Z'
  }
];

export const mockCostEntries = [
  {
    id: 201,
    jobId: 1,
    vendorId: 4,
    description: 'Carrier charge',
    currency: 'USD',
    amount: 1800,
    localAmount: 1800,
    status: 'POSTED',
    paymentStatus: 'PAID',
    docDate: '2026-04-19',
    createdAt: '2026-04-19T10:00:00.000Z'
  },
  {
    id: 202,
    jobId: 2,
    vendorId: 5,
    description: 'Customs and port fees',
    currency: 'USD',
    amount: 2400,
    localAmount: 2400,
    status: 'POSTED',
    paymentStatus: 'PAID',
    docDate: '2026-04-09',
    createdAt: '2026-04-09T10:00:00.000Z'
  },
  {
    id: 203,
    jobId: 3,
    vendorId: 4,
    description: 'Planned trucking cost',
    currency: 'USD',
    amount: 950,
    localAmount: 950,
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    docDate: '2026-04-22',
    createdAt: '2026-04-22T10:00:00.000Z'
  }
];

export function buildMockPaginatedResponse(items, page = 1, limit = 50) {
  return {
    items: items.slice(0, limit),
    meta: {
      page,
      limit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / limit))
    }
  };
}

export function getMockPartnersMap() {
  return mockPartners.reduce((result, partner) => {
    result[partner.id] = partner;
    return result;
  }, {});
}

export function getMockRevenueByJob(jobId) {
  return mockRevenueEntries.filter((entry) => Number(entry.jobId) === Number(jobId));
}

export function getMockCostByJob(jobId) {
  return mockCostEntries.filter((entry) => Number(entry.jobId) === Number(jobId));
}

export function getMockProfitSummary(jobId) {
  const revenue = getMockRevenueByJob(jobId);
  const cost = getMockCostByJob(jobId);
  const totalRevenue = revenue.reduce((sum, entry) => sum + Number(entry.localAmount ?? 0), 0);
  const totalCost = cost.reduce((sum, entry) => sum + Number(entry.localAmount ?? 0), 0);

  return {
    jobId: Number(jobId),
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
    revenueEntries: revenue.length,
    costEntries: cost.length
  };
}

export function getMockDashboardStats() {
  const totalRevenue = mockRevenueEntries.reduce((sum, entry) => sum + Number(entry.localAmount ?? 0), 0);
  const totalCost = mockCostEntries.reduce((sum, entry) => sum + Number(entry.localAmount ?? 0), 0);

  return {
    totalJobs: mockJobs.length,
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost
  };
}
