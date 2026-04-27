'use client';

import { Button, Card, Table, Space, Input, Select, DatePicker, Row, Col, Tag, Typography } from 'antd';
import {
  FilterOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Text } = Typography;
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getJobs } from '@/services/jobService';

/* ---- Badge helpers ---- */
const businessTypeBadge = {
  'Nhập Kinh Doanh': 'badge-blue',
  'Xuất Gia Công': 'badge-purple',
};

const streamBadge = {
  'Luồng Xanh': 'badge-green',
  'Luồng Vàng': 'badge-yellow',
  'Luồng Đỏ': 'badge-red',
};

const statusBadge = {
  'Đang vận chuyển': 'badge-status-transit',
  'Đã thông quan': 'badge-status-cleared',
  'Chờ kiểm hóa': 'badge-status-pending',
  'In Progress': 'badge-status-transit',
  Completed: 'badge-status-cleared',
  Pending: 'badge-status-pending',
};

function Badge({ className, children }) {
  return <span className={`badge ${className || ''}`}>{children}</span>;
}

/* ---- Static demo data enriched with Vietnamese fields ---- */
const demoData = [
  {
    id: '1',
    customerCode: 'CUST-001 / 0101234567',
    declarationNo: 'TK-2023-10928',
    businessType: 'Nhập Kinh Doanh',
    stream: 'Luồng Xanh',
    status: 'Đang vận chuyển',
    etd: '24/10/2023',
    eta: '15/11/2023',
    salesperson: 'Nguyễn Văn A',
    exporter: 'Global Tech Industries LLC',
    importer: 'Công ty TNHH Thương mại Vina',
    agent: 'Evergreen Marine Corp',
    goodsType: 'Linh kiện điện tử (FCL)',
    pol: 'Shanghai Port (CNSHA)',
    pod: 'Cát Lái (VNSGN)',
    container: 'CMAU1234567 / 890123',
    coType: 'Form E',
  },
  {
    id: '2',
    customerCode: 'CUST-089 / 0314987654',
    declarationNo: 'TK-2023-11002',
    businessType: 'Xuất Gia Công',
    stream: 'Luồng Vàng',
    status: 'Đã thông quan',
    etd: '28/10/2023',
    eta: '05/12/2023',
    salesperson: 'Trần Thị B',
    exporter: 'ABC Manufacturing Co., Ltd',
    importer: 'Samsung Electronics Vietnam',
    agent: 'OOCL Vietnam',
    goodsType: 'Hàng gia công (LCL)',
    pol: 'Cát Lái (VNSGN)',
    pod: 'Busan Port (KRPUS)',
    container: 'OOLU7654321 / 456789',
    coType: 'Form AK',
  },
  {
    id: '3',
    customerCode: 'CUST-142 / 0109988776',
    declarationNo: 'TK-2023-11045',
    businessType: 'Nhập Kinh Doanh',
    stream: 'Luồng Đỏ',
    status: 'Chờ kiểm hóa',
    etd: '01/11/2023',
    eta: '10/11/2023',
    salesperson: 'Lê Văn C',
    exporter: 'Deutsche Maschinen GmbH',
    importer: 'Công ty CP Cơ khí Sài Gòn',
    agent: 'Hapag-Lloyd Vietnam',
    goodsType: 'Máy móc công nghiệp (OOG)',
    pol: 'Hamburg Port (DEHAM)',
    pod: 'Hải Phòng (VNHPH)',
    container: 'HLCU9876543 / 112233',
    coType: 'Form EUR.1',
  },
];

/* ---- Expanded row renderer ---- */
function ExpandedRow({ record }) {
  const router = useRouter();
  return (
    <div className="expanded-row-detail">
      <div className="detail-grid">
        <div>
          <span className="detail-label">Người xuất khẩu</span>
          <span className="detail-value">{record.exporter}</span>
        </div>
        <div>
          <span className="detail-label">Người nhập khẩu</span>
          <span className="detail-value">{record.importer}</span>
        </div>
        <div>
          <span className="detail-label">Đại lý</span>
          <span className="detail-value">{record.agent}</span>
        </div>
        <div>
          <span className="detail-label">Loại hàng</span>
          <span className="detail-value">{record.goodsType}</span>
        </div>
        <div>
          <span className="detail-label">Cảng đi (POL)</span>
          <span className="detail-value">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle', color: '#727786' }}>flight_takeoff</span>
            {record.pol}
          </span>
        </div>
        <div>
          <span className="detail-label">Cảng đến (POD)</span>
          <span className="detail-value">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle', color: '#727786' }}>flight_land</span>
            {record.pod}
          </span>
        </div>
        <div>
          <span className="detail-label">Số Container / Số chì</span>
          <span className="detail-value detail-mono">{record.container}</span>
        </div>
        <div>
          <span className="detail-label">Loại C/O</span>
          <span className="detail-value">{record.coType}</span>
        </div>
      </div>
      <div className="detail-actions">
        <Button
          size="small"
          onClick={() => router.push(`/jobs/detail?id=${record.backendId || record.id}`)}
        >
          Chi tiết lô hàng
        </Button>
        <Button size="small">Sửa tờ khai</Button>
      </div>
    </div>
  );
}

/* ---- Main page ---- */
export default function JobsPage() {
  const router = useRouter();
  const [apiData, setApiData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getJobs()
      .then((result) => {
        if (!active) return;
        setApiData(result.items || []);
        if (result.meta) {
          setPagination({
            current: result.meta.page,
            pageSize: result.meta.limit,
            total: result.meta.total
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Merge API data with demo rows for display
  const mergedData = apiData.length > 0
    ? apiData.map((item, i) => ({
      ...demoData[i % demoData.length],
      ...item,
      customerCode: item.customer ? `${item.customer} / ${item.job_no}` : demoData[i % demoData.length].customerCode,
      declarationNo: item.job_no || demoData[i % demoData.length].declarationNo,
      status: item.status || demoData[i % demoData.length].status,
    }))
    : demoData;

  const totalCount = pagination.total || mergedData.length;

  const columns = [
    {
      title: 'Mã khách hàng / MST',
      dataIndex: 'customerCode',
      key: 'customerCode',
      render: (text) => <span style={{ fontWeight: 500, color: '#0057c2' }}>{text}</span>,
    },
    {
      title: 'Số tờ khai',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
    },
    {
      title: 'Loại hình KD',
      dataIndex: 'businessType',
      key: 'businessType',
      render: (val) => <Badge className={businessTypeBadge[val] || 'badge-blue'}>{val}</Badge>,
    },
    {
      title: 'Luồng tờ khai',
      dataIndex: 'stream',
      key: 'stream',
      render: (val) => <Badge className={streamBadge[val] || 'badge-green'}>{val}</Badge>,
    },
    {
      title: 'Trạng thái lô hàng',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const cls = statusBadge[val] || 'badge-status-pending';
        return (
          <Badge className={cls}>
            <span className="badge-dot" />
            {val}
          </Badge>
        );
      },
    },
    {
      title: 'ETD',
      dataIndex: 'etd',
      key: 'etd',
      render: (val) => <span style={{ color: '#414755' }}>{val || '-'}</span>,
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      render: (val) => <span style={{ color: '#414755' }}>{val || '-'}</span>,
    },
    {
      title: 'Nhân viên sale',
      dataIndex: 'salesperson',
      key: 'salesperson',
    },
  ];

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="shipment-page-header">
        <div>
          <h2>Danh mục Lô hàng</h2>
          <p>Quản lý và theo dõi trạng thái các lô hàng xuất nhập khẩu.</p>
        </div>
        <div className="shipment-page-actions">
          <Button icon={<DownloadOutlined />}>Xuất dữ liệu</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/jobs/create')}>Tạo lô hàng</Button>
        </div>
      </div>

      {/* Multi-dimensional Search & Filter Bar */}
      <Card
        style={{ borderRadius: 8, marginBottom: 24, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e2e2e2' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8} xl={5}>
            <div style={{ marginBottom: 6 }}><Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Job No.</Text></div>
            <Input placeholder="Nhập Job No..." size="large" style={{ borderRadius: 4 }} />
          </Col>
          <Col xs={24} sm={12} md={8} xl={5}>
            <div style={{ marginBottom: 6 }}><Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Tên khách hàng</Text></div>
            <Select placeholder="Tất cả khách hàng" size="large" style={{ width: '100%' }}>
              <Select.Option value="1">Global Tech Industries</Select.Option>
              <Select.Option value="2">Công ty Vina</Select.Option>
              <Select.Option value="3">Samsung Electronics</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} xl={5}>
            <div style={{ marginBottom: 6 }}><Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Số tờ khai</Text></div>
            <Input placeholder="Nhập số tờ khai..." size="large" style={{ borderRadius: 4 }} />
          </Col>
          <Col xs={24} sm={12} md={8} xl={5}>
            <div style={{ marginBottom: 6 }}><Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Ngày tạo</Text></div>
            <RangePicker size="large" style={{ width: '100%', borderRadius: 4 }} format="DD/MM/YYYY" />
          </Col>
          <Col xs={24} sm={12} md={8} xl={5}>
            <div style={{ marginBottom: 6 }}><Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Trạng thái</Text></div>
            <Select placeholder="Tất cả trạng thái" size="large" style={{ width: '100%' }}>
              <Select.Option value="new">Mới tạo</Select.Option>
              <Select.Option value="processing">Đang thông quan</Select.Option>
              <Select.Option value="shipped">Đã giao hàng</Select.Option>
            </Select>
          </Col>
        </Row>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Tag color="blue" closable style={{ padding: '4px 10px', fontSize: 12, borderRadius: 16, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' }}>
              Loại hình: Nhập kinh doanh
            </Tag>
            <Button type="link" style={{ padding: 0, fontWeight: 500 }}>Xóa tất cả bộ lọc</Button>
          </Space>
          <Space>
            <Button size="large" style={{ borderRadius: 4, fontWeight: 500 }}>Đặt lại</Button>
            <Button type="primary" size="large" icon={<SearchOutlined />} style={{ borderRadius: 4, fontWeight: 500 }}>Tìm kiếm</Button>
          </Space>
        </div>
      </Card>

      {/* Data table */}
      <Card
        style={{ borderRadius: 8, overflow: 'hidden' }}
      >
        {/* Toolbar */}
        <div className="shipment-toolbar">
          <span className="shipment-toolbar-total">Tổng số: {totalCount} lô hàng</span>
          <Space>
            <ReloadOutlined style={{ color: '#727786', cursor: 'pointer' }} />
            <SettingOutlined style={{ color: '#727786', cursor: 'pointer' }} />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={mergedData}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total}`,
          }}
          expandable={{
            expandedRowRender: (record) => <ExpandedRow record={record} />,
            expandRowByClick: true,
          }}
          size="small"
          onRow={(record) => ({
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </DashboardLayout>
  );
}
