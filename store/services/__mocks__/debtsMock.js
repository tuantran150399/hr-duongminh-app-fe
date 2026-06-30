// Dữ liệu mock cho tổng hợp công nợ
export const mockDebtSummary = {
  totalDebt: 1550000000,      // 1.55 tỷ
  totalLimit: 3000000000,     // 3 tỷ
  remainingLimit: 1450000000, // 1.45 tỷ
  overdueDebt: 350000000      // 350 triệu
};

// Dữ liệu mock cho danh sách khách hàng (12 khách hàng, 4 trạng thái x 3)
export const mockDebtCustomers = [
  // --- Trạng thái: NORMAL (Dưới 80% hạn mức, không nợ quá hạn) ---
  {
    id: 1,
    name: 'Công ty Cổ phần Vận tải biển Sài Gòn',
    currentDebt: 45000000,
    creditLimit: 200000000,
    usagePercent: 22.5,
    status: 'normal',
  },
  {
    id: 2,
    name: 'Công ty TNHH Logistics Ngôi Sao',
    currentDebt: 120000000,
    creditLimit: 500000000,
    usagePercent: 24,
    status: 'normal',
  },
  {
    id: 3,
    name: 'Tổng Công ty Tân Cảng Sài Gòn',
    currentDebt: 350000000,
    creditLimit: 1000000000,
    usagePercent: 35,
    status: 'normal',
  },

  // --- Trạng thái: NEAR_LIMIT (Từ 80% đến <100% hạn mức, không nợ quá hạn) ---
  {
    id: 4,
    name: 'Công ty Cổ phần XNK Bình Minh',
    currentDebt: 255000000,
    creditLimit: 300000000,
    usagePercent: 85,
    status: 'near_limit',
  },
  {
    id: 5,
    name: 'Công ty TNHH Dịch vụ Vận tải Hải Vân',
    currentDebt: 450000000,
    creditLimit: 500000000,
    usagePercent: 90,
    status: 'near_limit',
  },
  {
    id: 6,
    name: 'Doanh nghiệp Tư nhân Nam Phát',
    currentDebt: 95000000,
    creditLimit: 100000000,
    usagePercent: 95,
    status: 'near_limit',
  },

  // --- Trạng thái: OVER_LIMIT (Vượt 100% hạn mức, không nợ quá hạn) ---
  {
    id: 7,
    name: 'Công ty Cổ phần Đầu tư Thương mại Á Âu',
    currentDebt: 220000000,
    creditLimit: 200000000,
    usagePercent: 110,
    status: 'over_limit',
  },
  {
    id: 8,
    name: 'Công ty TNHH MTV Vận tải và Xếp dỡ Đại Nam',
    currentDebt: 550000000,
    creditLimit: 500000000,
    usagePercent: 110,
    status: 'over_limit',
  },
  {
    id: 9,
    name: 'Công ty Cổ phần Dược phẩm Trung ương 3',
    currentDebt: 350000000,
    creditLimit: 300000000,
    usagePercent: 116.7,
    status: 'over_limit',
  },

  // --- Trạng thái: OVERDUE (Có nợ quá hạn, không xét hạn mức) ---
  {
    id: 10,
    name: 'Công ty TNHH SX TM Dịch vụ Hoàng Kim',
    currentDebt: 180000000,
    creditLimit: 500000000,
    usagePercent: 36,
    status: 'overdue',
  },
  {
    id: 11,
    name: 'Công ty Cổ phần Vật liệu xây dựng Thái Bình',
    currentDebt: 450000000,
    creditLimit: 400000000,
    usagePercent: 112.5,
    status: 'overdue',
  },
  {
    id: 12,
    name: 'Tập đoàn Điện lạnh Thịnh Phát',
    currentDebt: 650000000,
    creditLimit: 1000000000,
    usagePercent: 65,
    status: 'overdue',
  }
];

// Hàm helper để tạo ngày mock
const createMockDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Dữ liệu mock cho chi tiết công nợ của từng khách hàng
export const mockDebtDetailByCustomer = {
  // --- NORMAL ---
  1: [
    { id: 101, invoiceCode: 'INV-2023-0101', amount: 20000000, dueDate: createMockDate(15), isOverdue: false },
    { id: 102, invoiceCode: 'INV-2023-0105', amount: 25000000, dueDate: createMockDate(30), isOverdue: false },
  ],
  2: [
    { id: 201, invoiceCode: 'INV-2023-0110', amount: 50000000, dueDate: createMockDate(10), isOverdue: false },
    { id: 202, invoiceCode: 'INV-2023-0112', amount: 70000000, dueDate: createMockDate(20), isOverdue: false },
  ],
  3: [
    { id: 301, invoiceCode: 'INV-2023-0120', amount: 150000000, dueDate: createMockDate(5), isOverdue: false },
    { id: 302, invoiceCode: 'INV-2023-0125', amount: 100000000, dueDate: createMockDate(25), isOverdue: false },
    { id: 303, invoiceCode: 'INV-2023-0130', amount: 100000000, dueDate: createMockDate(40), isOverdue: false },
  ],

  // --- NEAR_LIMIT ---
  4: [
    { id: 401, invoiceCode: 'INV-2023-0201', amount: 100000000, dueDate: createMockDate(12), isOverdue: false },
    { id: 402, invoiceCode: 'INV-2023-0205', amount: 155000000, dueDate: createMockDate(28), isOverdue: false },
  ],
  5: [
    { id: 501, invoiceCode: 'INV-2023-0210', amount: 200000000, dueDate: createMockDate(8), isOverdue: false },
    { id: 502, invoiceCode: 'INV-2023-0215', amount: 250000000, dueDate: createMockDate(22), isOverdue: false },
  ],
  6: [
    { id: 601, invoiceCode: 'INV-2023-0220', amount: 45000000, dueDate: createMockDate(14), isOverdue: false },
    { id: 602, invoiceCode: 'INV-2023-0222', amount: 50000000, dueDate: createMockDate(26), isOverdue: false },
  ],

  // --- OVER_LIMIT ---
  7: [
    { id: 701, invoiceCode: 'INV-2023-0301', amount: 120000000, dueDate: createMockDate(7), isOverdue: false },
    { id: 702, invoiceCode: 'INV-2023-0305', amount: 100000000, dueDate: createMockDate(18), isOverdue: false },
  ],
  8: [
    { id: 801, invoiceCode: 'INV-2023-0310', amount: 250000000, dueDate: createMockDate(11), isOverdue: false },
    { id: 802, invoiceCode: 'INV-2023-0315', amount: 300000000, dueDate: createMockDate(24), isOverdue: false },
  ],
  9: [
    { id: 901, invoiceCode: 'INV-2023-0320', amount: 150000000, dueDate: createMockDate(9), isOverdue: false },
    { id: 902, invoiceCode: 'INV-2023-0322', amount: 100000000, dueDate: createMockDate(21), isOverdue: false },
    { id: 903, invoiceCode: 'INV-2023-0325', amount: 100000000, dueDate: createMockDate(35), isOverdue: false },
  ],

  // --- OVERDUE ---
  10: [
    { id: 1001, invoiceCode: 'INV-2023-0401', amount: 80000000, dueDate: createMockDate(-15), isOverdue: true }, // Quá hạn 15 ngày
    { id: 1002, invoiceCode: 'INV-2023-0405', amount: 100000000, dueDate: createMockDate(10), isOverdue: false },
  ],
  11: [
    { id: 1101, invoiceCode: 'INV-2023-0410', amount: 150000000, dueDate: createMockDate(-30), isOverdue: true }, // Quá hạn 30 ngày
    { id: 1102, invoiceCode: 'INV-2023-0412', amount: 200000000, dueDate: createMockDate(-5), isOverdue: true },  // Quá hạn 5 ngày
    { id: 1103, invoiceCode: 'INV-2023-0415', amount: 100000000, dueDate: createMockDate(20), isOverdue: false },
  ],
  12: [
    { id: 1201, invoiceCode: 'INV-2023-0420', amount: 300000000, dueDate: createMockDate(15), isOverdue: false },
    { id: 1202, invoiceCode: 'INV-2023-0422', amount: 250000000, dueDate: createMockDate(25), isOverdue: false },
    { id: 1203, invoiceCode: 'INV-2023-0425', amount: 100000000, dueDate: createMockDate(-10), isOverdue: true }, // Quá hạn 10 ngày
  ],
};
