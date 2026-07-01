'use client';

import { Button, Card, Col, DatePicker, Input, Row, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLanguage } from '@/components/AppProviders';

const { RangePicker } = DatePicker;
const { Text } = Typography;

/**
 * FilterCard — component bộ lọc dùng chung cho các trang danh sách.
 *
 * Props:
 *   searchValue     — Giá trị tìm kiếm hiện tại
 *   onSearchChange  — Callback khi thay đổi search (event => void)
 *   searchPlaceholder — Placeholder cho ô search (default: dùng từ dictionary)
 *
 *   statusValue     — Giá trị filter status hiện tại
 *   onStatusChange  — Callback khi thay đổi status (value => void)
 *   statusOptions   — Mảng options cho status select [{value, label}]
 *
 *   dateRange       — Giá trị date range hiện tại [dayjs, dayjs] | null
 *   onDateRangeChange — Callback khi thay đổi date range
 *   showDateRange   — Có hiển thị date range filter không (default: true)
 *
 *   onReset         — Callback khi nhấn Reset
 *   extra           — ReactNode bổ sung thêm vào filter row
 *
 * Usage:
 *   <FilterCard
 *     searchValue={search}
 *     onSearchChange={(e) => setSearch(e.target.value)}
 *     statusValue={status}
 *     onStatusChange={setStatus}
 *     statusOptions={[{ value: 'all', label: 'All' }, ...]}
 *     dateRange={dateRange}
 *     onDateRangeChange={setDateRange}
 *     onReset={handleReset}
 *   />
 */
export default function FilterCard({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  statusValue,
  onStatusChange,
  statusOptions = [],
  dateRange,
  onDateRangeChange,
  showDateRange = true,
  onReset,
  extra
}) {
  const { t } = useLanguage();

  return (
    <Card className="filter-card">
      <Row gutter={[16, 16]} align="bottom">
        <Col xs={24} md={showDateRange ? 8 : 10}>
          <Text className="filter-label">{t('common.search')}</Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={searchPlaceholder || t('common.searchPlaceholder')}
            value={searchValue}
            onChange={onSearchChange}
            size="large"
          />
        </Col>

        {statusOptions.length > 0 ? (
          <Col xs={24} md={showDateRange ? 6 : 8}>
            <Text className="filter-label">{t('common.status')}</Text>
            <Select
              value={statusValue}
              onChange={onStatusChange}
              size="large"
              style={{ width: '100%' }}
              options={statusOptions}
            />
          </Col>
        ) : null}

        {showDateRange ? (
          <Col xs={24} md={7}>
            <Text className="filter-label">{t('common.dateRange')}</Text>
            <RangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Col>
        ) : null}

        {onReset ? (
          <Col xs={24} md={3}>
            <Button block size="large" onClick={onReset}>
              {t('common.reset')}
            </Button>
          </Col>
        ) : null}

        {extra}
      </Row>
    </Card>
  );
}
