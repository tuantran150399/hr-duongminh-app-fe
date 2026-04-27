'use client';
import dynamic from 'next/dynamic';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';

const { Title } = Typography;
const Spin = dynamic(() => import('antd').then((mod) => mod.Spin), { ssr: false });
const BankOutlined = dynamic(() => import('@ant-design/icons').then((mod) => mod.BankOutlined), { ssr: false });
const FileTextOutlined = dynamic(() => import('@ant-design/icons').then((mod) => mod.FileTextOutlined), { ssr: false });
const CompassOutlined = dynamic(() => import('@ant-design/icons').then((mod) => mod.CompassOutlined), { ssr: false });

export default function CreateJobPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Success:', values);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#414755', fontSize: 12, marginBottom: 4 }}>
              <a onClick={() => router.push('/jobs')} style={{ color: 'inherit', cursor: 'pointer' }}>Lô hàng</a>
              <RightOutlined style={{ fontSize: 10 }} />
              <span style={{ color: '#1b1b1b' }}>Thêm mới</span>
            </div>
            <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1b1b1b' }}>Thêm mới Lô hàng</Title>
          </div>
          <Space>
            <Button onClick={() => router.push('/jobs')}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ padding: '0 20px', fontWeight: 500 }}>Tạo Lô Hàng</Button>
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                {/* Thông tin đối tác */}
                <Card
                  title={<Space><BankOutlined style={{ color: '#0057c2' }} />Thông tin đối tác</Space>}
                  style={{ borderRadius: 8, borderColor: '#e2e2e2' }}
                >
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Mã khách hàng / MST <span style={{ color: '#ba1a1a', marginLeft: 4 }}>*</span></span>} name="customerCode" rules={[{ required: true, message: 'Bắt buộc' }]}>
                        <Input placeholder="Nhập mã KH hoặc MST" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Nhân viên sale</span>} name="salesperson">
                        <Select placeholder="Chọn nhân viên" size="large">
                          <Select.Option value="nguyenvana">Nguyễn Văn A</Select.Option>
                          <Select.Option value="tranthib">Trần Thị B</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Người gửi hàng (Shipper)</span>} name="shipper">
                        <Input placeholder="Tên người gửi hàng" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Người nhận hàng (Consignee)</span>} name="consignee">
                        <Input placeholder="Tên người nhận hàng" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Đại lý (Agent)</span>} name="agent">
                        <Input placeholder="Đại lý" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Thông tin tờ khai */}
                <Card
                  title={<Space><FileTextOutlined style={{ color: '#0057c2' }} />Thông tin tờ khai</Space>}
                  style={{ borderRadius: 8, borderColor: '#e2e2e2' }}
                >
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Số tờ khai</span>} name="declarationNo">
                        <Input placeholder="Nhập số tờ khai hải quan" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Loại hình kinh doanh</span>} name="businessType">
                        <Select placeholder="Chọn loại hình" size="large">
                          <Select.Option value="giacong">Gia công</Select.Option>
                          <Select.Option value="sxxk">SXXK</Select.Option>
                          <Select.Option value="kinhdoanh">Kinh doanh</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Luồng tờ khai</span>} name="stream">
                        <Select placeholder="Chọn luồng" size="large">
                          <Select.Option value="vang">Vàng</Select.Option>
                          <Select.Option value="xanh">Xanh</Select.Option>
                          <Select.Option value="do">Đỏ</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item label={<span style={{ fontWeight: 500 }}>Loại C/O</span>} name="coType">
                        <Select placeholder="Chọn loại C/O" size="large">
                          <Select.Option value="formE">Form E (ASEAN-China)</Select.Option>
                          <Select.Option value="formD">Form D (ASEAN)</Select.Option>
                          <Select.Option value="formAK">Form AK</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={<Space><CompassOutlined style={{ color: '#0057c2' }} />Thông tin vận chuyển</Space>}
                style={{ borderRadius: 8, borderColor: '#e2e2e2' }}
              >
                <Form.Item label={<span style={{ fontWeight: 500 }}>Tên tàu / Số chuyến</span>} name="vessel">
                  <Input placeholder="VD: EVER GIVEN / 001W" size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<span style={{ fontWeight: 500 }}>Cảng đi (POL)</span>} name="pol">
                      <Input placeholder="Cảng đi" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ fontWeight: 500 }}>Cảng đến (POD)</span>} name="pod">
                      <Input placeholder="Cảng đến" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<span style={{ fontWeight: 500 }}>Ngày khởi hành (ETD)</span>} name="etd">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ fontWeight: 500 }}>Ngày đến (ETA)</span>} name="eta">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label={<span style={{ fontWeight: 500 }}>Ngày giao hàng thực tế</span>} name="actualDelivery">
                  <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                </Form.Item>
                <div style={{ height: 1, background: '#e2e2e2', margin: '16px 0 24px' }} />
                <Form.Item label={<span style={{ fontWeight: 500 }}>Loại hàng</span>} name="cargoType">
                  <Select placeholder="Chọn loại hàng" size="large">
                    <Select.Option value="fcl">FCL</Select.Option>
                    <Select.Option value="lcl">LCL</Select.Option>
                    <Select.Option value="air">Hàng không (Air)</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label={<span style={{ fontWeight: 500 }}>Số container / Số chì</span>} name="containerStr">
                  <Input.TextArea placeholder="Nhập danh sách container (mỗi dòng 1 cont)" rows={4} />
                </Form.Item>
                <Form.Item label={<span style={{ fontWeight: 500 }}>Trạng thái lô hàng</span>} name="status">
                  <Select placeholder="Trạng thái" size="large">
                    <Select.Option value="new">Mới tạo</Select.Option>
                    <Select.Option value="processing">Đang xử lý</Select.Option>
                    <Select.Option value="customs">Chờ thông quan</Select.Option>
                    <Select.Option value="shipping">Đang vận chuyển</Select.Option>
                  </Select>
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </DashboardLayout>
  );
}
