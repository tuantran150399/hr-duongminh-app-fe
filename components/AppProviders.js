'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';

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
      settings: 'Settings',
      navigation: 'Navigation'
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
      settings: 'Cài đặt',
      navigation: 'Điều hướng'
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
    }
  }
};

const languageOptions = [
  { key: 'en', flag: 'US', emoji: '🇺🇸' },
  { key: 'vi', flag: 'VN', emoji: '🇻🇳' }
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

    if (!current) {
      return path;
    }

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
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within AppProviders.');
  }

  return context;
}
