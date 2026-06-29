'use client';

import {
  Alert, Avatar, Badge, Button, Card, Col, DatePicker, Form,
  Input, InputNumber, Modal, Popconfirm, Row, Select, Space,
  Statistic, Table, Tabs, Tag, Typography, App
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, EditOutlined, EyeOutlined, FileAddOutlined, FileExcelOutlined,
  LockOutlined, SearchOutlined, TeamOutlined, UserAddOutlined
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetAttendanceQuery,
  useGetPayrollQuery,
  useCreatePayrollRecordMutation,
  useFinalizePayrollMutation
} from '@/store/services/hrmApi';
import { formatCurrency, formatDate } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import { decimalInputProps } from '@/utils/formUtils';

const deptColors = {
  Operations: 'blue',
  Accounting: 'green',
  Sales: 'orange',
  Support: 'cyan',
  Management: 'purple'
};

const departmentsSeed = ['Operations', 'Accounting', 'Sales', 'Support', 'Management'];

const departmentAliases = {
  'Vận hành': 'Operations',
  'Kế toán': 'Accounting',
  'Kinh doanh': 'Sales',
  'Hỗ trợ': 'Support',
  'Quản lý': 'Management',
  'Ban giám đốc': 'Management'
};

function normalizeDepartment(department) {
  return departmentAliases[department] || department;
}

function getDepartmentLabel(department, t) {
  if (!department) return '-';
  const normalized = normalizeDepartment(department);
  const translationKey = `hrm.departments.${normalized}`;
  const translated = t(translationKey);
  return translated === translationKey ? department : translated;
}



function getPayrollMonth(record) {
  if (!record?.year || !record?.month) return '-';
  return `${record.year}-${String(record.month).padStart(2, '0')}`;
}

function splitPayrollMonth(value) {
  const [year, month] = String(value || '').split('-').map(Number);
  return { year, month };
}

export default function HRMPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [payrollForm] = Form.useForm();
  const [viewEmployee, setViewEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const { data: empData, isLoading: loadingEmp, error: empError } = useGetEmployeesQuery();
  const { data: attData, isLoading: loadingAtt, error: attError } = useGetAttendanceQuery();
  const { data: payData, isLoading: loadingPay, error: payError } = useGetPayrollQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [createPayrollRecord] = useCreatePayrollRecordMutation();
  const [finalizePayroll] = useFinalizePayrollMutation();

  const employees = useMemo(() => empData?.items ?? [], [empData?.items]);
  const employeeMap = useMemo(
    () => employees.reduce((map, employee) => ({ ...map, [employee.id]: employee }), {}),
    [employees]
  );

  const attendance = useMemo(
    () => (attData?.items ?? []).map((record) => {
      const employee = employeeMap[record.employeeId];
      return {
        ...record,
        employeeCode: employee?.employeeCode || `#${record.employeeId}`,
        employeeName: employee?.fullName || `Employee #${record.employeeId}`,
        workDateText: formatDate(record.workDate, language),
        workHours: Number(record.workHours || 0)
      };
    }),
    [attData?.items, employeeMap, language]
  );

  const payroll = useMemo(
    () => (payData?.items ?? []).map((record) => {
      const employee = employeeMap[record.employeeId];
      return {
        ...record,
        employeeCode: employee?.employeeCode || `#${record.employeeId}`,
        employeeName: employee?.fullName || `Employee #${record.employeeId}`,
        monthText: getPayrollMonth(record),
        baseSalary: Number(record.baseSalary || 0),
        allowance: Number(record.allowance || 0),
        deduction: Number(record.deduction || 0),
        netSalary: Number(record.netSalary || 0)
      };
    }),
    [payData?.items, employeeMap]
  );

  const loading = loadingEmp || loadingAtt || loadingPay;
  const loadError = empError || attError || payError ? t('hrm.loadError') : '';
  const activeCount = employees.filter((employee) => employee.status === 'ACTIVE').length;
  const totalPayroll = payroll.reduce((sum, record) => sum + (record.netSalary || 0), 0);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const keyword = search.toLowerCase();
    const code = employee.employeeCode || '';
    const matchSearch =
      !keyword ||
      employee.fullName?.toLowerCase().includes(keyword) ||
      code.toLowerCase().includes(keyword);
    const matchDept = deptFilter === 'All' || normalizeDepartment(employee.department) === deptFilter;
    return matchSearch && matchDept;
  }), [employees, search, deptFilter]);

  const departments = useMemo(
    () => ['All', ...new Set([
      ...departmentsSeed,
      ...employees.map((employee) => normalizeDepartment(employee.department)).filter(Boolean)
    ])],
    [employees]
  );

  async function saveEmployee(values) {
    try {
      let res;
      if (editingEmployee) {
        res = await updateEmployee({
          id: editingEmployee.id,
          ...values,
          hireDate: values.hireDate?.format ? values.hireDate.format('YYYY-MM-DD') : values.hireDate
        }).unwrap();
      } else {
        res = await createEmployee({
          ...values,
          hireDate: values.hireDate?.format ? values.hireDate.format('YYYY-MM-DD') : values.hireDate,
          status: 'ACTIVE'
        }).unwrap();
      }

      if (res && (res.error || (res.statusCode && res.statusCode >= 400))) {
        message.error(getApiError({ data: res }, t, editingEmployee ? 'hrm.updateEmpError' : 'hrm.addEmpError'));
        return;
      }

      message.success(editingEmployee ? t('hrm.updateEmpSuccess') : t('hrm.addEmpSuccess'));
      setModalOpen(false);
      setEditingEmployee(null);
      form.resetFields();
    } catch (err) {
      message.error(getApiError(err, t, editingEmployee ? 'hrm.updateEmpError' : 'hrm.addEmpError'));
    }
  }

  function openEditEmployee(record) {
    setEditingEmployee(record);
    form.setFieldsValue({
      employeeCode: record.employeeCode,
      fullName: record.fullName,
      phone: record.phone,
      department: record.department,
      position: record.position
    });
    setModalOpen(true);
  }

  async function handleDeactivateEmployee(record) {
    try {
      const res = await updateEmployee({ id: record.id, status: 'TERMINATED' }).unwrap();
      if (res && (res.error || (res.statusCode && res.statusCode >= 400))) {
        message.error(getApiError({ data: res }, t, 'hrm.deactivateError'));
      } else {
        message.success(t('hrm.deactivateSuccess'));
      }
    } catch (err) {
      message.error(getApiError(err, t, 'hrm.deactivateError'));
    }
  }

  async function savePayroll(values) {
    const { year, month } = splitPayrollMonth(values.month);
    try {
      const res = await createPayrollRecord({
        employeeId: Number(values.employeeId),
        year,
        month,
        baseSalary: Number(values.baseSalary || 0),
        allowance: Number(values.allowance || 0),
        deduction: Number(values.deduction || 0)
      }).unwrap();

      if (res && (res.error || (res.statusCode && res.statusCode >= 400))) {
        message.error(getApiError({ data: res }, t, 'hrm.createPayrollError'));
        return;
      }

      message.success(t('hrm.createPayrollSuccess'));
      setPayrollModalOpen(false);
      payrollForm.resetFields();
    } catch (err) {
      message.error(getApiError(err, t, 'hrm.createPayrollError'));
    }
  }

  const employeeColumns = [
    {
      title: t('hrm.employee'),
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#0057c2' }}>{record.fullName?.charAt(0)}</Avatar>
          <div>
            <strong>{record.fullName}</strong>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.employeeCode} · {record.position || '-'}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: t('hrm.department'),
      dataIndex: 'department',
      key: 'department',
      render: (department) => (
        <Tag color={deptColors[normalizeDepartment(department)] || 'default'}>
          {getDepartmentLabel(department, t)}
        </Tag>
      )
    },
    { title: t('hrm.joinDate'), dataIndex: 'hireDate', key: 'hireDate', render: (val) => formatDate(val, language) },
    { title: t('hrm.phone'), dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
    {
      title: t('hrm.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'ACTIVE') return <Tag color="green" icon={<CheckCircleOutlined />}>{t('hrm.active')}</Tag>;
        if (status === 'TERMINATED') return <Tag color="red">{t('hrm.inactive')}</Tag>;
        return <Tag color="default">{t('hrm.inactive')}</Tag>;
      }
    },
    {
      title: t('hrm.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EyeOutlined />} title={t('hrm.viewProfile')} onClick={() => setViewEmployee(record)} />
          <Button type="text" size="small" icon={<EditOutlined />} title={t('hrm.editEmployee')} onClick={() => openEditEmployee(record)} />
          {record.status === 'ACTIVE' && (
            <Popconfirm title={t('hrm.deactivateConfirm')} onConfirm={() => handleDeactivateEmployee(record)}>
              <Button type="text" size="small" danger icon={<LockOutlined />} title={t('hrm.deactivate')} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const attendanceColumns = [
    { title: t('hrm.empCode'), dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: t('hrm.fullName'), dataIndex: 'employeeName', key: 'employeeName', render: (value) => <strong>{value}</strong> },
    { title: t('accounting.date'), dataIndex: 'workDateText', key: 'workDateText' },
    { title: t('hrm.status'), dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
    { title: t('hrm.workDays'), dataIndex: 'workHours', key: 'workHours', align: 'center', render: (value) => <Badge count={value} color="#0057c2" showZero /> },
    { title: t('advances.notes'), dataIndex: 'notes', key: 'notes', render: (value) => value || '-' }
  ];

  const payrollColumns = [
    { title: t('hrm.empCode'), dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: t('hrm.fullName'), dataIndex: 'employeeName', key: 'employeeName', render: (value) => <strong>{value}</strong> },
    { title: t('hrm.month'), dataIndex: 'monthText', key: 'monthText' },
    { title: t('hrm.baseSalary'), dataIndex: 'baseSalary', key: 'baseSalary', align: 'right', render: (value) => formatCurrency(value) },
    { title: t('hrm.allowance'), dataIndex: 'allowance', key: 'allowance', align: 'right', render: (value) => formatCurrency(value) },
    { title: t('hrm.deduction'), dataIndex: 'deduction', key: 'deduction', align: 'right', render: (value) => <span style={{ color: '#ff4d4f' }}>-{formatCurrency(value)}</span> },
    { title: t('hrm.netSalary'), dataIndex: 'netSalary', key: 'netSalary', align: 'right', render: (value) => <strong style={{ color: '#0057c2' }}>{formatCurrency(value)}</strong> },
    {
      title: t('hrm.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => status === 'POSTED'
        ? <Tag color="green" icon={<CheckCircleOutlined />}>{t('hrm.finalized')}</Tag>
        : <Tag color="gold">{t('hrm.draft')}</Tag>
    },
    {
      title: t('hrm.actions'),
      key: 'actions',
      render: (_, record) => record.status === 'DRAFT' && (
        <Popconfirm title={t('hrm.finalizePayrollPrompt')} onConfirm={async () => {
          try {
            const res = await finalizePayroll(record.id).unwrap();
            if (res && (res.error || (res.statusCode && res.statusCode >= 400))) {
              message.error(getApiError({ data: res }, t, 'hrm.finalizeError'));
            } else {
              message.success(t('hrm.finalizeSuccess'));
            }
          } catch (err) {
            message.error(getApiError(err, t, 'hrm.finalizeError'));
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
          <div style={{ marginBottom: 16 }}>
            <FilterCard
              searchValue={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              searchPlaceholder={t('hrm.searchPlaceholder')}
              statusValue={deptFilter}
              onStatusChange={setDeptFilter}
              statusOptions={departments.map((department) => ({
                value: department,
                label: department === 'All' ? t('hrm.allDepartments') : getDepartmentLabel(department, t)
              }))}
              showDateRange={false}
            />
          </div>
          <Table
            rowKey="id"
            loading={loading}
            columns={employeeColumns}
            dataSource={filteredEmployees}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </div>
      )
    },
    {
      key: 'attendance',
      label: <span><ClockCircleOutlined /> {t('hrm.attendanceTab')}</span>,
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={attendanceColumns}
          dataSource={attendance}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 850 }}
          summary={(pageData) => {
            const totalHours = pageData.reduce((sum, record) => sum + (record.workHours || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={4}><strong>{t('hrm.total')}</strong></Table.Summary.Cell>
                <Table.Summary.Cell align="center"><strong>{totalHours}</strong></Table.Summary.Cell>
                <Table.Summary.Cell />
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
          <Table
            rowKey="id"
            loading={loading}
            columns={payrollColumns}
            dataSource={payroll}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10 }}
            summary={(pageData) => {
              const total = pageData.reduce((sum, record) => sum + (record.netSalary || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={6}><strong>{t('hrm.totalNetSalary')}</strong></Table.Summary.Cell>
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
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => { setEditingEmployee(null); form.resetFields(); setModalOpen(true); }}>
            {t('hrm.addEmployee')}
          </Button>
        )}
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.totalEmployees')} value={employees.length} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.activeEmployees')} value={activeCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('hrm.totalPayroll')} value={totalPayroll} formatter={(value) => formatCurrency(value)} prefix={<DollarOutlined />} valueStyle={{ color: '#0057c2' }} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setSearch(''); }} items={tabItems} />
      </Card>

      <Modal title={editingEmployee ? t('hrm.editEmpTitle') : t('hrm.addEmpTitle')} open={modalOpen} onCancel={() => { setModalOpen(false); setEditingEmployee(null); }}
        onOk={() => form.submit()} destroyOnHidden width={600}>
        <Form form={form} layout="vertical" onFinish={saveEmployee}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="employeeCode" label={t('hrm.empCode')} rules={[{ required: true }]}>
                <Input placeholder="EMP-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="fullName" label={t('hrm.fullName')} rules={[{ required: true }]}>
                <Input placeholder={t('hrm.empNamePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label={t('hrm.phone')}>
                <Input placeholder={t('hrm.phonePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="department" label={t('hrm.department')} rules={[{ required: true }]}>
                <Select options={departmentsSeed.map((department) => ({
                  value: department,
                  label: getDepartmentLabel(department, t)
                }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="position" label={t('hrm.position')} rules={[{ required: true }]}>
                <Input placeholder={t('hrm.position')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hireDate" label={t('hrm.joinDate')} rules={[{ required: true }]}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={t('hrm.createPayrollTitle')} open={payrollModalOpen} onCancel={() => setPayrollModalOpen(false)}
        onOk={() => payrollForm.submit()} destroyOnHidden width={580}>
        <Form form={payrollForm} layout="vertical" onFinish={savePayroll}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="employeeId" label={t('hrm.employee')} rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={employees.map((employee) => ({
                    value: employee.id,
                    label: `${employee.employeeCode} - ${employee.fullName}`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="month" label={t('hrm.monthFormat')} rules={[{ required: true }]}>
                <Input placeholder="2026-05" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="baseSalary" label={t('hrm.baseSalaryVnd')} rules={[{ required: true }]}>
                <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} step={500000} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="allowance" label={t('hrm.allowance')}>
                <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} step={100000} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deduction" label={t('hrm.deductionVnd')}>
            <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} step={100000} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Employee View Profile Modal */}
      <Modal
        title={t('hrm.viewProfile')}
        open={Boolean(viewEmployee)}
        onCancel={() => setViewEmployee(null)}
        footer={null}
        width={520}
      >
        {viewEmployee && (
          <div style={{ lineHeight: 2.2 }}>
            <Row gutter={16}>
              <Col span={12}><strong>{t('hrm.empCode')}:</strong> {viewEmployee.employeeCode}</Col>
              <Col span={12}><strong>{t('hrm.fullName')}:</strong> {viewEmployee.fullName}</Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <strong>{t('hrm.department')}:</strong>{' '}
                <Tag color={deptColors[normalizeDepartment(viewEmployee.department)] || 'default'}>
                  {getDepartmentLabel(viewEmployee.department, t)}
                </Tag>
              </Col>
              <Col span={12}><strong>{t('hrm.position')}:</strong> {viewEmployee.position || '-'}</Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><strong>{t('hrm.phone')}:</strong> {viewEmployee.phone || '-'}</Col>
              <Col span={12}><strong>{t('hrm.joinDate')}:</strong> {formatDate(viewEmployee.hireDate, language)}</Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <strong>{t('hrm.status')}:</strong>{' '}
                {viewEmployee.status === 'ACTIVE'
                  ? <Tag color="green" icon={<CheckCircleOutlined />}>{t('hrm.active')}</Tag>
                  : <Tag color="red">{t('hrm.inactive')}</Tag>}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
