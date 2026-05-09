const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/hrm/page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Import useLanguage
content = content.replace(
  "import DashboardLayout from '@/layouts/DashboardLayout';",
  "import DashboardLayout from '@/layouts/DashboardLayout';\nimport { useLanguage } from '@/components/AppProviders';"
);

// Add const { t } = useLanguage(); inside HRMPage
content = content.replace(
  "export default function HRMPage() {",
  "export default function HRMPage() {\n  const { t } = useLanguage();"
);

// Replace hardcoded strings with t('hrm.key')
const replacements = [
  { from: "loadError = empError ? 'Không thể kết nối backend – đang dùng dữ liệu mẫu.' : '';", to: "loadError = empError ? t('hrm.loadError') : '';" },
  { from: "message.success('Đã thêm nhân viên thành công.');", to: "message.success(t('hrm.addEmpSuccess'));" },
  { from: "message.error('Không thể lưu nhân viên.');", to: "message.error(t('hrm.addEmpError'));" },
  { from: "message.success('Đã tạo bảng lương.');", to: "message.success(t('hrm.createPayrollSuccess'));" },
  { from: "message.error('Không thể tạo bảng lương.');", to: "message.error(t('hrm.createPayrollError'));" },
  { from: "title: 'Nhân viên'", to: "title: t('hrm.employee')" },
  { from: "title: 'Bộ phận'", to: "title: t('hrm.department')" },
  { from: "title: 'Ngày vào làm'", to: "title: t('hrm.joinDate')" },
  { from: "title: 'SĐT'", to: "title: t('hrm.phone')" },
  { from: "title: 'Trạng thái'", to: "title: t('hrm.status')" },
  { from: "title: 'Thao tác'", to: "title: t('hrm.actions')" },
  { from: ">Xem hồ sơ</Button>", to: ">{t('hrm.viewProfile')}</Button>" },
  { from: ">Đang làm</Tag>", to: ">{t('hrm.active')}</Tag>" },
  { from: ">Nghỉ phép</Tag>", to: ">{t('hrm.onLeave')}</Tag>" },
  { from: ">Nghỉ việc</Tag>", to: ">{t('hrm.inactive')}</Tag>" },
  { from: "title: 'Mã NV'", to: "title: t('hrm.empCode')" },
  { from: "title: 'Họ tên'", to: "title: t('hrm.fullName')" },
  { from: "title: 'Tháng'", to: "title: t('hrm.month')" },
  { from: "title: 'Ngày công'", to: "title: t('hrm.workDays')" },
  { from: "title: 'Nghỉ phép', dataIndex: 'leaveDays'", to: "title: t('hrm.leaveDays'), dataIndex: 'leaveDays'" },
  { from: "title: 'Vắng'", to: "title: t('hrm.absentDays')" },
  { from: "title: 'OT (giờ)'", to: "title: t('hrm.overtimeHrs')" },
  { from: ">Tổng cộng</strong>", to: ">{t('hrm.total')}</strong>" },
  { from: "title: 'Lương cơ bản'", to: "title: t('hrm.baseSalary')" },
  { from: "title: 'Phụ cấp'", to: "title: t('hrm.allowance')" },
  { from: "title: 'OT', dataIndex: 'overtime'", to: "title: t('hrm.overtime'), dataIndex: 'overtime'" },
  { from: "title: 'Khấu trừ'", to: "title: t('hrm.deduction')" },
  { from: "title: 'Thực lĩnh'", to: "title: t('hrm.netSalary')" },
  { from: ">Đã chốt</Tag>", to: ">{t('hrm.finalized')}</Tag>" },
  { from: ">Nháp</Tag>", to: ">{t('hrm.draft')}</Tag>" },
  { from: "title=\"Chốt bảng lương này?\"", to: "title={t('hrm.finalizePayrollPrompt')}" },
  { from: "message.success('Đã chốt bảng lương.');", to: "message.success(t('hrm.finalizeSuccess'));" },
  { from: "message.error('Không thể chốt bảng lương.');", to: "message.error(t('hrm.finalizeError'));" },
  { from: ">Chốt</Button>", to: ">{t('hrm.finalize')}</Button>" },
  { from: "<span><TeamOutlined /> Nhân viên ({employees.length})</span>", to: "<span><TeamOutlined /> {t('hrm.employeesTab', { count: employees.length })}</span>" },
  { from: "placeholder=\"Tìm theo tên hoặc mã NV...\"", to: "placeholder={t('hrm.searchPlaceholder')}" },
  { from: "label: d === 'All' ? 'Tất cả bộ phận' : d", to: "label: d === 'All' ? t('hrm.allDepartments') : d" },
  { from: "<span><ClockCircleOutlined /> Chấm công & Nghỉ phép</span>", to: "<span><ClockCircleOutlined /> {t('hrm.attendanceTab')}</span>" },
  { from: "<span><DollarOutlined /> Quản lý Lương</span>", to: "<span><DollarOutlined /> {t('hrm.payrollTab')}</span>" },
  { from: ">Xuất Excel</Button>", to: ">{t('hrm.exportExcel')}</Button>" },
  { from: "Tạo bảng lương\\n              </Button>", to: "{t('hrm.createPayroll')}\\n              </Button>" },
  { from: ">Tổng thực lĩnh</strong>", to: ">{t('hrm.totalNetSalary')}</strong>" },
  { from: "className=\"page-title\">Nhân sự (HRM)</Typography.Title>", to: "className=\"page-title\">{t('hrm.title')}</Typography.Title>" },
  { from: "Quản lý hồ sơ nhân viên, chấm công, nghỉ phép và bảng lương hàng tháng.\\n          </Typography.Paragraph>", to: "{t('hrm.subtitle')}\\n          </Typography.Paragraph>" },
  { from: "Thêm nhân viên\\n          </Button>", to: "{t('hrm.addEmployee')}\\n          </Button>" },
  { from: "title=\"Tổng nhân viên\"", to: "title={t('hrm.totalEmployees')}" },
  { from: "title=\"Đang làm việc\"", to: "title={t('hrm.activeEmployees')}" },
  { from: "title=\"Tổng lương tháng (ước)\"", to: "title={t('hrm.totalPayroll')}" },
  { from: "title=\"Thêm nhân viên\"", to: "title={t('hrm.addEmpTitle')}" },
  { from: "label=\"Họ và tên\"", to: "label={t('hrm.fullName')}" },
  { from: "label=\"Số điện thoại\"", to: "label={t('hrm.phone')}" },
  { from: "label=\"Bộ phận\"", to: "label={t('hrm.department')}" },
  { from: "label=\"Chức vụ\"", to: "label={t('hrm.position')}" },
  { from: "label=\"Ngày vào làm\"", to: "label={t('hrm.joinDate')}" },
  { from: "title=\"Tạo bảng lương\"", to: "title={t('hrm.createPayrollTitle')}" },
  { from: "label=\"Mã nhân viên\"", to: "label={t('hrm.empCode')}" },
  { from: "label=\"Tháng (YYYY-MM)\"", to: "label={t('hrm.monthFormat')}" },
  { from: "label=\"Lương cơ bản (VND)\"", to: "label={t('hrm.baseSalaryVnd')}" },
  { from: "label=\"Phụ cấp (VND)\"", to: "label={t('hrm.allowanceVnd')}" },
  { from: "label=\"Phụ cấp\"", to: "label={t('hrm.allowance')}" },
  { from: "label=\"Lương OT\"", to: "label={t('hrm.otSalary')}" },
  { from: "label=\"Khấu trừ (BHXH, thuế...)\"", to: "label={t('hrm.deductionVnd')}" },
  { from: "label=\"Họ tên (ghi chú)\"", to: "label={t('hrm.fullNameNote')}" }
];

for (const r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync(filePath, content);
console.log('Done replacing strings in HRMPage');
