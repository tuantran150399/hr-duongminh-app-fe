'use client';

import {
  Alert, Avatar, Badge, Button, Card, Col, DatePicker, Form,
  Input, InputNumber, Modal, Popconfirm, Row, Select, Space,
  Statistic, Table, Tabs, Tag, Typography, message
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, FileAddOutlined, FileExcelOutlined,
  SearchOutlined, TeamOutlined, UserAddOutlined
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetAttendanceQuery,
  useGetPayrollQuery,
  useCreatePayrollRecordMutation,
  useFinalizePayrollMutation
} from '@/store/services/hrmApi';
import { formatCurrency } from '@/utils/format';

// ── Mock fallback data ────────────────────────────────────────────────────────
const MOCK_EMPLOYEES = [
  { id: 1, code: 'EMP-001', fullName: 'Nguyễn Văn An', department: 'Vận hành', position: 'Trưởng phòng', joinDate: '2022-01-10', status: 'ACTIVE', phone: '0901234567' },
  { id: 2, code: 'EMP-002', fullName: 'Trần Thị Bình', department: 'Kế toán', position: 'Kế toán viên', joinDate: '2022-03-15', status: 'ACTIVE', phone: '0912345678' },
  { id: 3, code: 'EMP-003', fullName: 'Lê Văn Cường', department: 'Kinh doanh', position: 'Sales Executive', joinDate: '2023-06-01', status: 'ON_LEAVE', phone: '0923456789' },
  { id: 4, code: 'EMP-004', fullName: 'Phạm Thị Dung', department: 'Hỗ trợ', position: 'Nhân viên CSKH', joinDate: '2023-09-20', status: 'ACTIVE', phone: '0934567890' },
  { id: 5, code: 'EMP-005', fullName: 'Hoàng Văn Em', department: 'Vận hành', position: 'Khai báo hải quan', joinDate: '2021-11-05', status: 'INACTIVE', phone: '0945678901' }
];

const MOCK_ATTENDANCE = [
  { id: 1, employeeCode: 'EMP-001', employeeName: 'Nguyễn Văn An', month: '2026-05', workDays: 22, leaveDays: 0, absentDays: 0, overtimeHours: 4 },
  { id: 2, employeeCode: 'EMP-002', employeeName: 'Trần Thị Bình', month: '2026-05', workDays: 20, leaveDays: 2, absentDays: 0, overtimeHours: 0 },
  { id: 3, employeeCode: 'EMP-003', employeeName: 'Lê Văn Cường', month: '2026-05', workDays: 18, leaveDays: 4, absentDays: 0, overtimeHours: 2 },
  { id: 4, employeeCode: 'EMP-004', employeeName: 'Phạm Thị Dung', month: '2026-05', workDays: 22, leaveDays: 0, absentDays: 0, overtimeHours: 0 },
  { id: 5, employeeCode: 'EMP-005', employeeName: 'Hoàng Văn Em', month: '2026-05', workDays: 0, leaveDays: 0, absentDays: 22, overtimeHours: 0 }
];

const MOCK_PAYROLL = [
  { id: 1, employeeCode: 'EMP-001', employeeName: 'Nguyễn Văn An', month: '2026-05', baseSalary: 15000000, allowance: 2000000, overtime: 800000, deduction: 1500000, netSalary: 16300000, status: 'FINALIZED' },
  { id: 2, employeeCode: 'EMP-002', employeeName: 'Trần Thị Bình', month: '2026-05', baseSalary: 12000000, allowance: 1500000, overtime: 0, deduction: 1200000, netSalary: 12300000, status: 'DRAFT' },
  { id: 3, employeeCode: 'EMP-003', employeeName: 'Lê Văn Cường', month: '2026-05', baseSalary: 10000000, allowance: 1000000, overtime: 400000, deduction: 1000000, netSalary: 10400000, status: 'DRAFT' },
  { id: 4, employeeCode: 'EMP-004', employeeName: 'Phạm Thị Dung', month: '2026-05', baseSalary: 9000000, allowance: 500000, overtime: 0, deduction: 900000, netSalary: 8600000, status: 'DRAFT' }
];

const deptColors = { 'Vận hành': 'blue', 'Kế toán': 'green', 'Kinh doanh': 'orange', 'Hỗ trợ': 'cyan' };

export default function HRMPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [payrollForm] = Form.useForm();

  // RTK Query hooks — fall back to mock data if API errors
  const { data: empData, isLoading: loadingEmp, error: empError } = useGetEmployeesQuery();
  const { data: attData, isLoading: loadingAtt } = useGetAttendanceQuery();
  const { data: payData, isLoading: loadingPay } = useGetPayrollQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [createPayrollRecord] = useCreatePayrollRecordMutation();
  const [finalizePayroll] = useFinalizePayrollMutation();

  const employees = empError
    ? MOCK_EMPLOYEES
    : (empData?.items?.length ? empData.items : MOCK_EMPLOYEES);
  const attendance = attData?.items?.length ? attData.items : MOCK_ATTENDANCE;
  const payroll = payData?.items?.length ? payData.items : MOCK_PAYROLL;
  const loading = loadingEmp || loadingAtt || loadingPay;
  const loadError = empError ? t('hrm.loadError') : '';

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const totalPayroll = payroll.reduce((s, r) => s + (r.netSalary || 0), 0);

  // ── Filtered employees ─────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => employees.filter(e => {
    const kw = search.toLowerCase();
    const matchSearch = !kw || e.fullName?.toLowerCase().includes(kw) || e.code?.toLowerCase().includes(kw);
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    return matchSearch && matchDept;
  }), [employees, search, deptFilter]);

  const departments = useMemo(() => ['All', ...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  // ── Save employee ──────────────────────────────────────────────────────────
  async function saveEmployee(values) {
    try {
      await createEmployee({
        ...values,
        joinDate: values.joinDate?.format ? values.joinDate.format('YYYY-MM-DD') : values.joinDate,
        status: 'ACTIVE'
      }).unwrap();
      message.success(t('hrm.addEmpSuccess'));
      setModalOpen(false);
    } catch {
      message.error(t('hrm.addEmpError'));
    }
  }

  // ── Save payroll ───────────────────────────────────────────────────────────
  async function savePayroll(values) {
    const base = Number(values.baseSalary || 0);
    const allowance = Number(values.allowance || 0);
    const overtime = Number(values.overtime || 0);
    const deduction = Number(values.deduction || 0);
    const netSalary = base + allowance + overtime - deduction;
    try {
      await createPayrollRecord({ ...values, netSalary, status: 'DRAFT' }).unwrap();
      message.success(t('hrm.createPayrollSuccess'));
      setPayrollModalOpen(false);
    } catch {
      message.error(t('hrm.createPayrollError'));
    }
  }

  // ── Column definitions ─────────────────────────────────────────────────────
  const employeeColumns = [
    {
      title: t('hrm.employee'),
      key: 'name',
      render: (_, r) => (
        <Space>
          <Avatar style={{ backgroundColor: '#0057c2' }}>{r.fullName?.charAt(0)}</Avatar>
          <div>
            <strong>{r.fullName}</strong>
            <div style={{ fontSize: 12, color: '#888' }}>{r.code} · {r.position}</div>
          </div>
        </Space>
      )
    },
    { title: t('hrm.department'), dataIndex: 'department', key: 'department', render: d => <Tag color={deptColors[d] || 'default'}>{d}</Tag> },
    { title: t('hrm.joinDate'), dataIndex: 'joinDate', key: 'joinDate' },
    { title: t('hrm.phone'), dataIndex: 'phone', key: 'phone' },
    {
      title: t('hrm.status'), dataIndex: 'status', key: 'status',
      render: s => {
        if (s === 'ACTIVE') return <Tag color="green" icon={<CheckCircleOutlined />}>{t('hrm.active')}</Tag>;
        if (s === 'ON_LEAVE') return <Tag color="orange" icon={<ClockCircleOutlined />}>{t('hrm.onLeave')}</Tag>;
        return <Tag color="default">{t('hrm.inactive')}</Tag>;
      }
    },
    { title: t('hrm.actions'), key: 'actions', render: () => <Button type="link">{t('hrm.viewProfile')}</Button> }
  ];

  const attendanceColumns = [
    { title: t('hrm.empCode'), dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: t('hrm.fullName'), dataIndex: 'employeeName', key: 'employeeName', render: v => <strong>{v}</strong> },
    { title: t('hrm.month'), dataIndex: 'month', key: 'month' },
    { title: t('hrm.workDays'), dataIndex: 'workDays', key: 'workDays', align: 'center', render: v => <Badge count={v} color="#0057c2" showZero /> },
    { title: t('hrm.leaveDays'), dataIndex: 'leaveDays', key: 'leaveDays', align: 'center', render: v => <Badge count={v} color="#fa8c16" showZero /> },
    { title: t('hrm.absentDays'), dataIndex: 'absentDays', key: 'absentDays', align: 'center', render: v => <Badge count={v} color="#ff4d4f" showZero /> },
    { title: t('hrm.overtimeHrs'), dataIndex: 'overtimeHours', key: 'overtimeHours', align: 'center', render: v => v ? <Tag color="purple">{v}h</Tag> : '-' }
  ];

  const payrollColumns = [
    { title: t('hrm.empCode'), dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: t('hrm.fullName'), dataIndex: 'employeeName', key: 'employeeName', render: v => <strong>{v}</strong> },
    { title: t('hrm.month'), dataIndex: 'month', key: 'month' },
    { title: t('hrm.baseSalary'), dataIndex: 'baseSalary', key: 'baseSalary', align: 'right', render: v => formatCurrency(v) },
    { title: t('hrm.allowance'), dataIndex: 'allowance', key: 'allowance', align: 'right', render: v => formatCurrency(v) },
    { title: t('hrm.overtime'), dataIndex: 'overtime', key: 'overtime', align: 'right', render: v => formatCurrency(v) },
    { title: t('hrm.deduction'), dataIndex: 'deduction', key: 'deduction', align: 'right', render: v => <span style={{ color: '#ff4d4f' }}>-{formatCurrency(v)}</span> },
    { title: t('hrm.netSalary'), dataIndex: 'netSalary', key: 'netSalary', align: 'right', render: v => <strong style={{ color: '#0057c2' }}>{formatCurrency(v)}</strong> },
    {
      title: t('hrm.status'), dataIndex: 'status', key: 'status',
      render: s => s === 'FINALIZED'
        ? <Tag color="green" icon={<CheckCircleOutlined />}>{t('hrm.finalized')}</Tag>
        : <Tag color="gold">{t('hrm.draft')}</Tag>
    },
    {
      title: t('hrm.actions'), key: 'actions',
      render: (_, r) => r.status !== 'FINALIZED' && (
        <Popconfirm title={t('hrm.finalizePayrollPrompt')} onConfirm={async () => {
          try {
            await finalizePayroll(r.id).unwrap();
            message.success(t('hrm.finalizeSuccess'));
          } catch {
            message.error(t('hrm.finalizeError'));
          }
        }}>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>{t('hrm.finalize')}</Button>
        </Popconfirm>
      )
    }
  ];

  const tabItems = [
    {
      key: 'employees',
      label: <span><TeamOutlined /> {t('hrm.employeesTab', { count: employees.length })}</span>,
      children: (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Input prefix={<SearchOutlined />} placeholder={t('hrm.searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
            <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 180 }}
              options={departments.map(d => ({ value: d, label: d === 'All' ? t('hrm.allDepartments') : d }))} />
          </div>
          <Table rowKey="id" loading={loading} columns={employeeColumns}
            dataSource={filteredEmployees} pagination={{ pageSize: 10 }} />
        </div>
      )
    },
    {
      key: 'attendance',
      label: <span><ClockCircleOutlined /> {t('hrm.attendanceTab')}</span>,
      children: (
        <Table rowKey="id" loading={loading} columns={attendanceColumns}
          dataSource={attendance} pagination={{ pageSize: 10 }}
          summary={pageData => {
            const totalWork = pageData.reduce((s, r) => s + (r.workDays || 0), 0);
            const totalLeave = pageData.reduce((s, r) => s + (r.leaveDays || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={3}><strong>{t('hrm.total')}</strong></Table.Summary.Cell>
                <Table.Summary.Cell align="center"><strong>{totalWork}</strong></Table.Summary.Cell>
                <Table.Summary.Cell align="center"><strong>{totalLeave}</strong></Table.Summary.Cell>
                <Table.Summary.Cell colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      )
    },
    {
      key: 'payroll',
      label: <span><DollarOutlined /> {t('hrm.payrollTab')}</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Space>
              <Button icon={<FileExcelOutlined />}>{t('hrm.exportExcel')}</Button>
              <Button type="primary" icon={<FileAddOutlined />} onClick={() => { payrollForm.resetFields(); setPayrollModalOpen(true); }}>
                {t('hrm.createPayrollBtn')}
              </Button>
            </Space>
          </div>
          <Table rowKey="id" loading={loading} columns={payrollColumns}
            dataSource={payroll} scroll={{ x: 1000 }} pagination={{ pageSize: 10 }}
            summary={pageData => {
              const total = pageData.reduce((s, r) => s + (r.netSalary || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={7}><strong>{t('hrm.totalNetSalary')}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell align="right"><strong style={{ color: '#0057c2' }}>{formatCurrency(total)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell colSpan={2} />
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('hrm.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('hrm.subtitle')}
          </Typography.Paragraph>
        </div>
        {activeTab === 'employees' && (
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            {t('hrm.addEmployee')}
          </Button>
        )}
      </div>

      {loadError && <Alert type="warning" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.totalEmployees')} value={employees.length} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.activeEmployees')} value={activeCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.totalPayroll')} value={totalPayroll} formatter={v => formatCurrency(v)} prefix={<DollarOutlined />} valueStyle={{ color: '#0057c2' }} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Tabs activeKey={activeTab} onChange={key => { setActiveTab(key); setSearch(''); }} items={tabItems} />
      </Card>

      {/* Add Employee Modal */}
      <Modal title={t('hrm.addEmpTitle')} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()} destroyOnHidden width={600}>
        <Form form={form} layout="vertical" onFinish={saveEmployee}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label={t('hrm.fullName')} rules={[{ required: true }]}>
                <Input placeholder={t('hrm.empNamePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t('hrm.phone')}>
                <Input placeholder={t('hrm.phonePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label={t('hrm.department')} rules={[{ required: true }]}>
                <Select options={['Vận hành', 'Kế toán', 'Kinh doanh', 'Hỗ trợ', 'Quản lý'].map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label={t('hrm.position')} rules={[{ required: true }]}>
                <Input placeholder={t('hrm.position')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="joinDate" label={t('hrm.joinDate')} rules={[{ required: true }]}>
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Payroll Modal */}
      <Modal title={t('hrm.createPayrollTitle')} open={payrollModalOpen} onCancel={() => setPayrollModalOpen(false)}
        onOk={() => payrollForm.submit()} destroyOnHidden width={580}>
        <Form form={payrollForm} layout="vertical" onFinish={savePayroll}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeCode" label={t('hrm.empCode')} rules={[{ required: true }]}>
                <Select showSearch options={employees.map(e => ({ value: e.code, label: `${e.code} – ${e.fullName}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="month" label={t('hrm.monthFormat')} rules={[{ required: true }]}>
                <Input placeholder="2026-05" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="baseSalary" label={t('hrm.baseSalaryVnd')} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={500000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="allowance" label={t('hrm.allowance')}>
                <InputNumber style={{ width: '100%' }} min={0} step={100000} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="overtime" label={t('hrm.otSalary')}>
                <InputNumber style={{ width: '100%' }} min={0} step={100000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deduction" label={t('hrm.deductionVnd')}>
                <InputNumber style={{ width: '100%' }} min={0} step={100000} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="employeeName" label={t('hrm.fullNameNote')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
