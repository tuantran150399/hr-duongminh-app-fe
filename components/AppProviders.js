'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { StoreProvider } from '@/store/StoreProvider';

const STORAGE_KEY = 'erp_logistics_language';

const dictionary = {
  en: {
    common: {
      workspace: 'Workspace',
      signOut: 'Sign out',
      exportCsv: 'Export CSV',
      exportExcel: 'Export Excel',
      resetFilters: 'Reset filters',
      allStatuses: 'All statuses',
      searchByJobNumber: 'Search by job number',
      noDataToExport: 'There is no data to export for the current view.',
      exportSuccess: 'Exported {count} rows.',
      underPreparation: '{label} is ready for the next implementation step.'
    },
    header: {
      language: 'Language',
      english: 'English',
      vietnamese: 'Vietnamese'
    },
    menu: {
      dashboard: 'Dashboard',
      jobs: 'Jobs',
      partners: 'Partners',
      accounting: 'Accounting',
      paymentRequests: 'Payment Requests',
      debtPolicies: 'Debt Policies',
      reports: 'Reports',
      pricing: 'Pricing',
      hrm: 'HRM',
      settings: 'Users & Roles',
      branches: 'Branches',
      audit: 'Audit Logs',
      navigation: 'Navigation',
      advances: 'Advances & Reimbursements'
    },
    login: {
      loginSuccess: 'Signed in successfully',
      loginError: 'Sign in failed. Please check your credentials.',
      usernameRequired: 'Please enter your username or email',
      usernamePlaceholder: 'Username or email',
      passwordRequired: 'Please enter your password',
      passwordPlaceholder: 'Password',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign in',
      version: 'Version 1.0.2'
    },
    accounting: {
      breadcrumb1: 'Operations',
      breadcrumb2: 'Finance',
      breadcrumb3: 'Accounting dashboard',
      title: 'Accounting',
      subtitle: 'Track receivables, payables, and cash collection from one operational workspace.',
      revenue: 'Revenue',
      cost: 'Cost',
      revenueDescription: 'Customer invoices, payment collection, and aging.',
      costDescription: 'Vendor costs, approvals, and settlement tracking.',
      createInvoice: 'Create Invoice',
      addCostEntry: 'Add Cost Entry',
      totalRevenue: 'Total Revenue',
      totalCost: 'Total Cost',
      paidSettled: 'Paid / Settled',
      outstanding: 'Outstanding',
      draftItems: 'Draft Items',
      acrossRecords: 'Across {count} finance records',
      trackedValue: '{percent}% of tracked value',
      noPaidRecords: 'No paid records yet',
      openRecords: '{count} open records need follow-up',
      draftsExcluded: 'Drafts are excluded from settled cash flow',
      invoiceOperations: 'Invoice operations',
      recordsInView: '{count} records in view',
      pageOf: 'Page {current} of {total}',
      rowRange: '{start}-{end} of {total} records',
      noRevenueRecords: 'No revenue records match the current filters.',
      noCostRecords: 'No cost records match the current filters.',
      statusDistribution: 'Status distribution',
      statusDistributionCopy: 'A quick view of where cash flow is concentrated.',
      noChartData: 'No chart data available',
      reviewCadenceTitle: 'Review cadence',
      reviewCadenceCopy: 'Use the date range filter to review period-end collections and vendor settlement trends.',
      jobNumber: 'Job Number',
      amount: 'Amount',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      receivableRecord: 'Receivable record',
      payableRecord: 'Payable record',
      view: 'View',
      receipt: 'Receipt',
      remind: 'Remind'
    },
    hrm: {
      title: 'Human Resources (HRM)',
      subtitle: 'Manage employee profiles, attendance, leave, and monthly payroll.',
      addEmployee: 'Add Employee',
      totalEmployees: 'Total Employees',
      activeEmployees: 'Active Employees',
      totalPayroll: 'Est. Monthly Payroll',
      employeesTab: 'Employees',
      attendanceTab: 'Attendance & Leave',
      payrollTab: 'Payroll Management',
      searchPlaceholder: 'Search name or code...',
      allDepartments: 'All Departments',
      exportExcel: 'Export Excel',
      createPayroll: 'Create Payroll',
      employee: 'Employee',
      department: 'Department',
      joinDate: 'Join Date',
      phone: 'Phone',
      status: 'Status',
      actions: 'Actions',
      viewProfile: 'View Profile',
      active: 'Active',
      onLeave: 'On Leave',
      inactive: 'Inactive',
      empCode: 'Emp Code',
      fullName: 'Full Name',
      month: 'Month',
      workDays: 'Work Days',
      leaveDays: 'Leave Days',
      absentDays: 'Absent Days',
      overtimeHrs: 'OT (hrs)',
      total: 'Total',
      baseSalary: 'Base Salary',
      allowance: 'Allowance',
      overtime: 'Overtime',
      deduction: 'Deduction',
      netSalary: 'Net Salary',
      finalized: 'Finalized',
      draft: 'Draft',
      finalizePayrollPrompt: 'Finalize this payroll?',
      finalize: 'Finalize',
      totalNetSalary: 'Total Net Salary',
      addEmpSuccess: 'Employee added successfully.',
      addEmpError: 'Failed to add employee.',
      createPayrollSuccess: 'Payroll created.',
      createPayrollError: 'Failed to create payroll.',
      finalizeSuccess: 'Payroll finalized.',
      finalizeError: 'Failed to finalize payroll.',
      loadError: 'Cannot connect to backend – using mock data.',
      addEmpTitle: 'Add Employee',
      position: 'Position',
      createPayrollTitle: 'Create Payroll',
      monthFormat: 'Month (YYYY-MM)',
      baseSalaryVnd: 'Base Salary (VND)',
      allowanceVnd: 'Allowance (VND)',
      otSalary: 'OT Salary',
      deductionVnd: 'Deduction (Insurance, Tax...)',
      fullNameNote: 'Full Name (Note)'
    },
    reports: {
      title: 'Reports',
      subtitle: 'Financial and operational summaries.',
      exportExcel: 'Export Excel',
      dateRange: 'Date Range',
      exportStarted: 'Report export started.',
      exportError: 'Unable to export report.',
      loadError: 'Unable to load report data.',
      branchSummary: 'Branch Summary',
      customerSummary: 'Customer Summary',
      jobStatus: 'Job Status',
      receivables: 'Receivables',
      payables: 'Payables',
      overdueReceivables: 'Overdue Receivables',
      overduePayables: 'Overdue Payables',
      pnl: 'P&L',
      cashFlow: 'Cash Flow',
      branchId: 'Branch ID',
      customerId: 'Customer ID',
      totalRevenue: 'Total Revenue',
      totalCost: 'Total Cost',
      profit: 'Profit',
      status: 'Status',
      count: 'Count',
      paymentStatus: 'Payment Status',
      entryCount: 'Entry Count',
      totalAmount: 'Total Amount',
      entryId: 'Entry ID',
      jobId: 'Job ID',
      amount: 'Amount',
      dueDate: 'Due Date',
      period: 'Period',
      revenue: 'Revenue',
      cost: 'Cost',
      netProfit: 'Net Profit',
      totalInflow: 'Total Inflow',
      totalOutflow: 'Total Outflow',
      netCashFlow: 'Net Cash Flow'
    },
    debtPolicies: {
      title: 'Debt Policies',
      subtitle: 'Set debt limits and maximum debt age for each partner.',
      addPolicy: 'Add Policy',
      totalPolicies: 'Total Policies',
      activePolicies: 'Active Policies',
      totalDebtLimit: 'Total Debt Limit',
      loadError: 'Unable to load debt policies from the backend.',
      saveSuccess: 'Debt policy saved successfully.',
      saveError: 'Unable to save debt policy.',
      modalTitle: 'Debt Policy',
      partner: 'Partner',
      maxDebtAmount: 'Max Debt Amount',
      maxDebtAmountOptional: 'Max Debt Amount (Optional)',
      maxDebtAgeDays: 'Max Debt Age (Days)',
      maxDebtAgeDaysOptional: 'Max Debt Age in Days (Optional)',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      status: 'Status',
      selectPartner: 'Select partner',
      partnerRequired: 'Partner is required.',
      amountPlaceholder: 'E.g., 500000000',
      daysPlaceholder: 'E.g., 30',
      notAvailable: 'N/A',
      daysSuffix: '{count} days'
    },
    paymentRequests: {
      title: 'Payment Requests',
      subtitle: 'Manage and approve vendor payment requests with a three-step workflow.',
      addRequest: 'Create Request',
      totalValue: 'Total Value',
      pendingApproval: 'Pending Approval',
      finalApproved: 'Final Approved',
      rejected: 'Rejected',
      loadError: 'Unable to load payment requests from the backend.',
      createSuccess: 'Payment request created successfully.',
      createError: 'Unable to create payment request.',
      approveSuccess: 'Payment request approved by department.',
      approveError: 'Unable to approve request.',
      finalApproveSuccess: 'Payment request final approved.',
      finalApproveError: 'Unable to final approve request.',
      rejectSuccess: 'Payment request rejected.',
      rejectError: 'Unable to reject request.',
      modalTitle: 'Create Payment Request',
      rejectModalTitle: 'Reject Payment Request',
      rejectButton: 'Reject',
      id: 'ID',
      jobVendor: 'Job / Vendor',
      amount: 'Amount',
      requestedDate: 'Req. Date',
      reason: 'Reason',
      status: 'Status',
      actions: 'Actions',
      vendor: 'Vendor',
      jobOptional: 'Job No. (Optional)',
      currency: 'Currency',
      requestedPaymentDate: 'Requested Payment Date',
      rejectionReason: 'Rejection Reason',
      provideReason: 'Provide a reason for the payment...',
      explainReject: 'Please explain why...',
      selectVendor: 'Select vendor',
      selectJob: 'Select job (if applicable)',
      vendorRequired: 'Vendor is required.',
      amountRequired: 'Amount is required.',
      reasonRequired: 'Reason is required.',
      rejectReasonRequired: 'Reason is required to reject.',
      approveConfirm: 'Approve this request?',
      finalApproveConfirm: 'Final approve this request?',
      departmentApprove: 'Department Approve',
      finalApprove: 'Final Approve',
      reject: 'Reject',
      jobLabel: 'Job: {jobNo}',
      pendingDepartmentApproval: 'Pending Approval',
      departmentApproved: 'Dept. Approved',
      rejectedStatus: 'Rejected',
      finalApprovedStatus: 'Final Approved'
    }
  },
  vi: {
    common: {
      workspace: 'Không gian làm việc',
      signOut: 'Đăng xuất',
      exportCsv: 'Xuất CSV',
      exportExcel: 'Xuất Excel',
      resetFilters: 'Đặt lại bộ lọc',
      allStatuses: 'Tất cả trạng thái',
      searchByJobNumber: 'Tìm theo mã job',
      noDataToExport: 'Không có dữ liệu để xuất theo bộ lọc hiện tại.',
      exportSuccess: 'Đã xuất {count} dòng dữ liệu.',
      underPreparation: '{label} đang sẵn sàng cho bước triển khai tiếp theo.'
    },
    header: {
      language: 'Ngôn ngữ',
      english: 'Tiếng Anh',
      vietnamese: 'Tiếng Việt'
    },
    menu: {
      dashboard: 'Bảng điều khiển',
      jobs: 'Lô hàng',
      partners: 'Đối tác',
      accounting: 'Kế toán',
      paymentRequests: 'Yêu cầu thanh toán',
      debtPolicies: 'Chính sách công nợ',
      reports: 'Báo cáo',
      pricing: 'Bảng giá',
      hrm: 'Nhân sự (HRM)',
      settings: 'Người dùng & quyền',
      branches: 'Chi nhánh',
      audit: 'Nhật ký',
      navigation: 'Điều hướng',
      advances: 'Tạm ứng & Hoàn ứng'
    },
    login: {
      loginSuccess: 'Đăng nhập thành công',
      loginError: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      usernameRequired: 'Vui lòng nhập tên đăng nhập hoặc email',
      usernamePlaceholder: 'Tên đăng nhập hoặc email',
      passwordRequired: 'Vui lòng nhập mật khẩu',
      passwordPlaceholder: 'Mật khẩu',
      forgotPassword: 'Quên mật khẩu?',
      signIn: 'Đăng nhập',
      version: 'Phiên bản 1.0.2'
    },
    accounting: {
      breadcrumb1: 'Vận hành',
      breadcrumb2: 'Tài chính',
      breadcrumb3: 'Bảng điều khiển kế toán',
      title: 'Kế toán',
      subtitle: 'Theo dõi công nợ phải thu, phải trả và dòng tiền thu chi trong một màn hình vận hành.',
      revenue: 'Doanh thu',
      cost: 'Chi phí',
      revenueDescription: 'Quản lý hóa đơn khách hàng, thu tiền và tình trạng công nợ.',
      costDescription: 'Quản lý chi phí nhà cung cấp, phê duyệt và thanh toán.',
      createInvoice: 'Tạo hóa đơn',
      addCostEntry: 'Thêm chi phí',
      totalRevenue: 'Tổng doanh thu',
      totalCost: 'Tổng chi phí',
      paidSettled: 'Đã thu / Đã thanh toán',
      outstanding: 'Còn tồn',
      draftItems: 'Bản nháp',
      acrossRecords: 'Trên {count} bút toán tài chính',
      trackedValue: '{percent}% giá trị đã được xử lý',
      noPaidRecords: 'Chưa có khoản nào đã thanh toán',
      openRecords: 'Còn {count} khoản cần theo dõi',
      draftsExcluded: 'Các bản nháp chưa được tính vào dòng tiền đã chốt',
      invoiceOperations: 'Nghiệp vụ hóa đơn',
      recordsInView: 'Có {count} dòng trong danh sách',
      pageOf: 'Trang {current} / {total}',
      rowRange: '{start}-{end} trên tổng {total} dòng',
      noRevenueRecords: 'Không có dữ liệu doanh thu phù hợp bộ lọc hiện tại.',
      noCostRecords: 'Không có dữ liệu chi phí phù hợp bộ lọc hiện tại.',
      statusDistribution: 'Phân bổ trạng thái',
      statusDistributionCopy: 'Xem nhanh giá trị đang nằm ở từng trạng thái xử lý.',
      noChartData: 'Chưa có dữ liệu biểu đồ',
      reviewCadenceTitle: 'Nhịp kiểm tra',
      reviewCadenceCopy: 'Dùng bộ lọc ngày để rà soát tình hình thu tiền và thanh toán theo từng kỳ.',
      jobNumber: 'Mã Job',
      amount: 'Số tiền',
      status: 'Trạng thái',
      date: 'Ngày',
      actions: 'Thao tác',
      receivableRecord: 'Bút toán phải thu',
      payableRecord: 'Bút toán phải trả',
      view: 'Xem',
      receipt: 'Biên nhận',
      remind: 'Nhắc việc'
    },
    hrm: {
      title: 'Nhân sự (HRM)',
      subtitle: 'Quản lý hồ sơ nhân viên, chấm công, nghỉ phép và bảng lương hàng tháng.',
      addEmployee: 'Thêm nhân viên',
      totalEmployees: 'Tổng nhân viên',
      activeEmployees: 'Đang làm việc',
      totalPayroll: 'Tổng lương tháng (ước)',
      employeesTab: 'Nhân viên',
      attendanceTab: 'Chấm công & Nghỉ phép',
      payrollTab: 'Quản lý Lương',
      searchPlaceholder: 'Tìm theo tên hoặc mã NV...',
      allDepartments: 'Tất cả bộ phận',
      exportExcel: 'Xuất Excel',
      createPayroll: 'Tạo bảng lương',
      employee: 'Nhân viên',
      department: 'Bộ phận',
      joinDate: 'Ngày vào làm',
      phone: 'SĐT',
      status: 'Trạng thái',
      actions: 'Thao tác',
      viewProfile: 'Xem hồ sơ',
      active: 'Đang làm',
      onLeave: 'Nghỉ phép',
      inactive: 'Nghỉ việc',
      empCode: 'Mã NV',
      fullName: 'Họ tên',
      month: 'Tháng',
      workDays: 'Ngày công',
      leaveDays: 'Nghỉ phép',
      absentDays: 'Vắng',
      overtimeHrs: 'OT (giờ)',
      total: 'Tổng cộng',
      baseSalary: 'Lương cơ bản',
      allowance: 'Phụ cấp',
      overtime: 'OT',
      deduction: 'Khấu trừ',
      netSalary: 'Thực lĩnh',
      finalized: 'Đã chốt',
      draft: 'Nháp',
      finalizePayrollPrompt: 'Chốt bảng lương này?',
      finalize: 'Chốt',
      totalNetSalary: 'Tổng thực lĩnh',
      addEmpSuccess: 'Đã thêm nhân viên thành công.',
      addEmpError: 'Không thể lưu nhân viên.',
      createPayrollSuccess: 'Đã tạo bảng lương.',
      createPayrollError: 'Không thể tạo bảng lương.',
      finalizeSuccess: 'Đã chốt bảng lương.',
      finalizeError: 'Không thể chốt bảng lương.',
      loadError: 'Không thể kết nối backend – đang dùng dữ liệu mẫu.',
      addEmpTitle: 'Thêm nhân viên',
      position: 'Chức vụ',
      createPayrollTitle: 'Tạo bảng lương',
      monthFormat: 'Tháng (YYYY-MM)',
      baseSalaryVnd: 'Lương cơ bản (VND)',
      allowanceVnd: 'Phụ cấp (VND)',
      otSalary: 'Lương OT',
      deductionVnd: 'Khấu trừ (BHXH, thuế...)',
      fullNameNote: 'Họ tên (ghi chú)'
    },
    reports: {
      title: 'Báo cáo',
      subtitle: 'Tổng hợp tài chính và vận hành.',
      exportExcel: 'Xuất Excel',
      dateRange: 'Khoảng ngày',
      exportStarted: 'Đã bắt đầu xuất báo cáo.',
      exportError: 'Không thể xuất báo cáo.',
      loadError: 'Không thể tải dữ liệu báo cáo.',
      branchSummary: 'Tổng hợp chi nhánh',
      customerSummary: 'Tổng hợp khách hàng',
      jobStatus: 'Trạng thái job',
      receivables: 'Phải thu',
      payables: 'Phải trả',
      overdueReceivables: 'Phải thu quá hạn',
      overduePayables: 'Phải trả quá hạn',
      pnl: 'Lãi lỗ',
      cashFlow: 'Dòng tiền',
      branchId: 'Mã chi nhánh',
      customerId: 'Mã khách hàng',
      totalRevenue: 'Tổng doanh thu',
      totalCost: 'Tổng chi phí',
      profit: 'Lợi nhuận',
      status: 'Trạng thái',
      count: 'Số lượng',
      paymentStatus: 'Trạng thái thanh toán',
      entryCount: 'Số bút toán',
      totalAmount: 'Tổng số tiền',
      entryId: 'Mã bút toán',
      jobId: 'Mã job',
      amount: 'Số tiền',
      dueDate: 'Ngày đến hạn',
      period: 'Kỳ',
      revenue: 'Doanh thu',
      cost: 'Chi phí',
      netProfit: 'Lợi nhuận thuần',
      totalInflow: 'Tổng tiền vào',
      totalOutflow: 'Tổng tiền ra',
      netCashFlow: 'Dòng tiền thuần'
    },
    debtPolicies: {
      title: 'Chính sách công nợ',
      subtitle: 'Thiết lập giới hạn công nợ và số ngày nợ tối đa cho từng đối tác.',
      addPolicy: 'Thêm chính sách',
      totalPolicies: 'Tổng chính sách',
      activePolicies: 'Đang áp dụng',
      totalDebtLimit: 'Tổng hạn mức công nợ',
      loadError: 'Không thể tải chính sách công nợ từ backend.',
      saveSuccess: 'Đã lưu chính sách công nợ.',
      saveError: 'Không thể lưu chính sách công nợ.',
      modalTitle: 'Chính sách công nợ',
      partner: 'Đối tác',
      maxDebtAmount: 'Hạn mức công nợ',
      maxDebtAmountOptional: 'Hạn mức công nợ (Tùy chọn)',
      maxDebtAgeDays: 'Số ngày nợ tối đa',
      maxDebtAgeDaysOptional: 'Số ngày nợ tối đa (Tùy chọn)',
      active: 'Đang áp dụng',
      inactive: 'Ngừng áp dụng',
      actions: 'Thao tác',
      status: 'Trạng thái',
      selectPartner: 'Chọn đối tác',
      partnerRequired: 'Vui lòng chọn đối tác.',
      amountPlaceholder: 'Ví dụ: 500000000',
      daysPlaceholder: 'Ví dụ: 30',
      notAvailable: 'Không áp dụng',
      daysSuffix: '{count} ngày'
    },
    paymentRequests: {
      title: 'Yêu cầu thanh toán',
      subtitle: 'Quản lý và duyệt yêu cầu thanh toán nhà cung cấp theo luồng 3 bước.',
      addRequest: 'Tạo yêu cầu',
      totalValue: 'Tổng giá trị',
      pendingApproval: 'Chờ duyệt',
      finalApproved: 'Đã duyệt cuối',
      rejected: 'Từ chối',
      loadError: 'Không thể tải yêu cầu thanh toán từ backend.',
      createSuccess: 'Đã tạo yêu cầu thanh toán.',
      createError: 'Không thể tạo yêu cầu thanh toán.',
      approveSuccess: 'Đã duyệt yêu cầu ở cấp phòng ban.',
      approveError: 'Không thể duyệt yêu cầu.',
      finalApproveSuccess: 'Đã duyệt cuối yêu cầu thanh toán.',
      finalApproveError: 'Không thể duyệt cuối yêu cầu.',
      rejectSuccess: 'Đã từ chối yêu cầu thanh toán.',
      rejectError: 'Không thể từ chối yêu cầu.',
      modalTitle: 'Tạo yêu cầu thanh toán',
      rejectModalTitle: 'Từ chối yêu cầu thanh toán',
      rejectButton: 'Từ chối',
      id: 'Mã',
      jobVendor: 'Job / Nhà cung cấp',
      amount: 'Số tiền',
      requestedDate: 'Ngày yêu cầu',
      reason: 'Lý do',
      status: 'Trạng thái',
      actions: 'Thao tác',
      vendor: 'Nhà cung cấp',
      jobOptional: 'Mã Job (Tùy chọn)',
      currency: 'Tiền tệ',
      requestedPaymentDate: 'Ngày đề nghị thanh toán',
      rejectionReason: 'Lý do từ chối',
      provideReason: 'Nhập lý do thanh toán...',
      explainReject: 'Vui lòng giải thích lý do...',
      selectVendor: 'Chọn nhà cung cấp',
      selectJob: 'Chọn job (nếu có)',
      vendorRequired: 'Vui lòng chọn nhà cung cấp.',
      amountRequired: 'Vui lòng nhập số tiền.',
      reasonRequired: 'Vui lòng nhập lý do.',
      rejectReasonRequired: 'Cần nhập lý do để từ chối.',
      approveConfirm: 'Duyệt yêu cầu này?',
      finalApproveConfirm: 'Duyệt cuối yêu cầu này?',
      departmentApprove: 'Duyệt phòng ban',
      finalApprove: 'Duyệt cuối',
      reject: 'Từ chối',
      jobLabel: 'Job: {jobNo}',
      pendingDepartmentApproval: 'Chờ duyệt',
      departmentApproved: 'Đã duyệt phòng ban',
      rejectedStatus: 'Từ chối',
      finalApprovedStatus: 'Đã duyệt cuối'
    }
  }
};

const languageOptions = [
  { key: 'en', flag: 'US', emoji: 'US' },
  { key: 'vi', flag: 'VN', emoji: 'VN' }
];

const antdLocales = {
  en: enUS,
  vi: viVN
};

const LanguageContext = createContext(null);

function interpolate(text, params = {}) {
  return String(text).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
}

function createTranslator(language) {
  return function translate(path, params) {
    const keys = path.split('.');
    let current = dictionary[language];

    for (const key of keys) {
      current = current?.[key];
    }

    if (!current) return path;
    return typeof current === 'string' ? interpolate(current, params) : current;
  };
}

export function AppProviders({ children }) {
  const [language, setLanguage] = useState('vi');

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (storedLanguage === 'en' || storedLanguage === 'vi') {
      window.setTimeout(() => setLanguage(storedLanguage), 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const contextValue = {
    language,
    setLanguage,
    t: createTranslator(language),
    options: languageOptions
  };

  return (
    <StoreProvider>
      <AntdRegistry>
        <LanguageContext.Provider value={contextValue}>
          <ConfigProvider
            locale={antdLocales[language]}
            theme={{
              token: {
                colorPrimary: '#0057c2',
                colorBgBase: '#f9f9f9',
                colorBgContainer: '#ffffff',
                fontFamily: '"Inter", sans-serif',
                borderRadius: 4
              },
              components: {
                Button: {
                  colorPrimary: '#0057c2',
                  colorPrimaryHover: '#004398',
                  colorPrimaryActive: '#001a43'
                }
              }
            }}
          >
            {children}
          </ConfigProvider>
        </LanguageContext.Provider>
      </AntdRegistry>
    </StoreProvider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within AppProviders.');
  }
  return context;
}
