export const dashboardStats = {
  totalJobs: 128,
  totalRevenue: 186500,
  totalCost: 121800,
  profit: 64700
};

export const jobs = [
  {
    id: '1',
    job_no: 'JOB-2026-001',
    customer: 'Minh Long Trading',
    status: 'In Progress',
    origin: 'Ho Chi Minh',
    destination: 'Da Nang',
    etd: '2026-04-25',
    eta: '2026-04-27'
  },
  {
    id: '2',
    job_no: 'JOB-2026-002',
    customer: 'Blue Ocean Foods',
    status: 'Completed',
    origin: 'Hai Phong',
    destination: 'Singapore',
    etd: '2026-04-12',
    eta: '2026-04-16'
  },
  {
    id: '3',
    job_no: 'JOB-2026-003',
    customer: 'An Phat Manufacturing',
    status: 'Pending',
    origin: 'Binh Duong',
    destination: 'Bangkok',
    etd: '2026-04-30',
    eta: '2026-05-03'
  }
];

export const jobFinancials = {
  '1': {
    revenue: [
      { id: 'r1', description: 'Freight charge', amount: 3200, status: 'Issued', date: '2026-04-20' },
      { id: 'r2', description: 'Handling fee', amount: 450, status: 'Draft', date: '2026-04-21' }
    ],
    cost: [
      { id: 'c1', description: 'Truck vendor', amount: 1100, status: 'Approved', date: '2026-04-20' },
      { id: 'c2', description: 'Port fee', amount: 380, status: 'Pending', date: '2026-04-21' }
    ]
  },
  '2': {
    revenue: [{ id: 'r3', description: 'Sea freight', amount: 5800, status: 'Paid', date: '2026-04-10' }],
    cost: [{ id: 'c3', description: 'Carrier charge', amount: 4100, status: 'Paid', date: '2026-04-11' }]
  },
  '3': {
    revenue: [{ id: 'r4', description: 'Transport estimate', amount: 2100, status: 'Draft', date: '2026-04-22' }],
    cost: [{ id: 'c4', description: 'Vendor estimate', amount: 1450, status: 'Draft', date: '2026-04-22' }]
  }
};

export const partners = [
  { id: '1', name: 'Minh Long Trading', type: 'Customer', phone: '+84 28 1111 2222' },
  { id: '2', name: 'Blue Ocean Foods', type: 'Customer', phone: '+84 24 3333 4444' },
  { id: '3', name: 'Saigon Trucking Co.', type: 'Vendor', phone: '+84 28 5555 6666' },
  { id: '4', name: 'Pacific Carrier', type: 'Vendor', phone: '+65 6777 8888' }
];

export const accountingRevenue = [
  { id: 'ar1', amount: 3200, status: 'Issued', date: '2026-04-20', job_no: 'JOB-2026-001' },
  { id: 'ar2', amount: 5800, status: 'Paid', date: '2026-04-10', job_no: 'JOB-2026-002' },
  { id: 'ar3', amount: 2100, status: 'Draft', date: '2026-04-22', job_no: 'JOB-2026-003' }
];

export const accountingCost = [
  { id: 'ac1', amount: 1100, status: 'Approved', date: '2026-04-20', job_no: 'JOB-2026-001' },
  { id: 'ac2', amount: 4100, status: 'Paid', date: '2026-04-11', job_no: 'JOB-2026-002' },
  { id: 'ac3', amount: 1450, status: 'Draft', date: '2026-04-22', job_no: 'JOB-2026-003' }
];
