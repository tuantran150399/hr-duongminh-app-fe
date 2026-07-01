'use client';

import {
  App,
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import {
  useGetDebitNotesQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
  usePostDebitNoteMutation,
  useVoidDebitNoteMutation,
  useSendDebitNoteMutation,
  useRecordDebitNotePaymentMutation,
  useExportDebitNoteMutation,
  useGetDebitCobCandidatesQuery,
  usePreviewDebitDebtMutation,
  useLazyGetDebitNoteByIdQuery
} from '@/store/services/debitNotesApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetServicePricesQuery } from '@/store/services/pricingApi';
import { formatCurrency, formatDate } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import { decimalInputProps } from '@/utils/formUtils';
import { useAppSelector } from '@/store/hooks';
import { selectUserRoles } from '@/store/slices/authSlice';

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

const paymentMethodOptions = [
  { value: 'CASH', labelKey: 'debitNotes.paymentMethodCash' },
  { value: 'BANK', labelKey: 'debitNotes.paymentMethodBank' }
];

function normalizeMatchText(value) {
  return String(value || '').trim().toLowerCase();
}

function isBlankRoute(value) {
  return normalizeMatchText(value) === '';
}

function normalizeUnit(value) {
  return normalizeMatchText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘/g, 'd');
}

function countContainers(containerNo) {
  const items = String(containerNo || '')
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length || 0;
}

function quantityForUnit(priceUnit, job) {
  const raw = job?.raw || job || {};
  const unit = normalizeUnit(priceUnit);
  const cargoUnit = normalizeUnit(raw.cargoUnit);
  const cargoQuantity = Number(raw.cargoQuantity || 0);
  const weightKg = Number(raw.weightKg || 0);
  const volumeCbm = Number(raw.volumeCbm || 0);
  const containerCount = cargoUnit === 'container' && cargoQuantity > 0
    ? cargoQuantity
    : countContainers(raw.containerNo || raw.container);

  if (['cont', 'container', 'cntr'].includes(unit)) return containerCount || 1;
  if (['cbm', 'm3'].includes(unit)) return volumeCbm || (cargoUnit === 'cbm' ? cargoQuantity : 0) || 1;
  if (['kg', 'kgs'].includes(unit)) return weightKg || (cargoUnit === 'kg' ? cargoQuantity : 0) || 1;
  if (['ton', 'tons', 'tan'].includes(unit)) return cargoUnit === 'ton' && cargoQuantity > 0 ? cargoQuantity : (weightKg > 0 ? weightKg / 1000 : 1);
  return 1;
}

function sortByServiceAndEffectiveDate(a, b) {
  const serviceCompare = String(a.serviceType || '').localeCompare(String(b.serviceType || ''));
  if (serviceCompare !== 0) return serviceCompare;
  return new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime();
}

function validateLineItemQuantityRanges(lineItems, allPrices, t) {
  if (!lineItems?.length || !allPrices?.length) return null;

  const priceMap = new Map(allPrices.map((price) => [price.id, price]));

  for (let index = 0; index < lineItems.length; index += 1) {
    const line = lineItems[index];
    if (!line.pricingId) continue;

    const price = priceMap.get(line.pricingId);
    if (!price) continue;

    const quantity = Number(line.quantity || 1);
    const minQuantity = price.minQuantity === undefined || price.minQuantity === null ? null : Number(price.minQuantity);
    const maxQuantity = price.maxQuantity === undefined || price.maxQuantity === null ? null : Number(price.maxQuantity);
    const lineLabel = line.description || line.serviceType || `${t('debitNotes.lineItems')} ${index + 1}`;

    if (minQuantity !== null && quantity < minQuantity) {
      return `${lineLabel}: ${t('pricing.minQuantity')} ${minQuantity}`;
    }

    if (maxQuantity !== null && quantity > maxQuantity) {
      return `${lineLabel}: ${t('pricing.maxQuantity')} ${maxQuantity}`;
    }
  }

  return null;
}

function LineItemsEditor({ lineItems, setLineItems, allPrices, selectedPartnerId, selectedJobIds, jobs, t, message }) {
  const [descriptionModal, setDescriptionModal] = useState({ open: false, lineKey: null });
  const manualLineSequence = useRef(0);
  const selectedJobs = useMemo(
    () => jobs.filter((job) => selectedJobIds?.includes(job.backendId)),
    [jobs, selectedJobIds]
  );

  const selectedJobOptions = useMemo(
    () => selectedJobs.map((job) => ({ value: job.backendId, label: job.job_no || job.id })),
    [selectedJobs]
  );

  // Find applicable tariffs based on selected customer + job route
  const suggestedPrices = useMemo(() => {
    if (!allPrices?.length || !selectedJobs.length) return [];
    const customerPrices = allPrices.filter((price) => price.isActive !== false && price.partnerId === selectedPartnerId);

    return selectedJobs.flatMap((selectedJob) => {
      const origin = normalizeMatchText(selectedJob?.origin || selectedJob?.raw?.pol || '');
      const destination = normalizeMatchText(selectedJob?.destination || selectedJob?.raw?.pod || '');

      if (origin && destination) {
      const routePrices = customerPrices
        .filter((price) => normalizeMatchText(price.routeFrom) === origin && normalizeMatchText(price.routeTo) === destination)
        .sort(sortByServiceAndEffectiveDate);
        if (routePrices.length) return routePrices.map((price) => ({ ...price, jobId: selectedJob.backendId, job: selectedJob }));
      }

      return customerPrices
        .filter((price) => isBlankRoute(price.routeFrom) && isBlankRoute(price.routeTo))
        .sort(sortByServiceAndEffectiveDate)
        .map((price) => ({ ...price, jobId: selectedJob.backendId, job: selectedJob }));
    });
  }, [allPrices, selectedPartnerId, selectedJobs]);

  function applyPricing() {
    if (!suggestedPrices.length) {
      message.info(t('debitNotes.noPricingFound'));
      return;
    }

    const newLines = suggestedPrices.map((price, index) => {
      const quantity = quantityForUnit(price.unit, price.job);
      const unitPrice = Number(price.amount || 0);
      return ({
        key: `auto-${Date.now()}-${index}`,
        jobId: price.jobId,
        serviceType: price.serviceType || '',
        description: [
          price.job?.job_no || price.job?.id,
          price.serviceType,
          price.shipmentMode,
          [price.routeFrom, price.routeTo].filter(Boolean).join(' → '),
          price.unit ? `(${price.unit})` : '',
          price.notes
        ].filter(Boolean).join(' - '),
        chargeNote: `${formatCurrency(unitPrice)} ${price.currency || 'VND'}/${price.unit || 'LOT'}`,
        lineNote: '',
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        creditAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        currency: price.currency || 'VND',
        pricingId: price.id,
        isAutoFilled: true
      });
    });

    setLineItems([...lineItems.filter((line) => line.cobEntryId), ...newLines]);
    message.success(t('debitNotes.pricingApplied', { count: newLines.length }));
  }

  function addEmptyLine(jobId = selectedJobIds?.[0] || null) {
    setLineItems([
      ...lineItems,
      {
        key: `manual-${++manualLineSequence.current}`,
        jobId,
        serviceType: '',
        description: '',
        chargeNote: '',
        lineNote: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        creditAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        currency: 'VND',
        pricingId: null,
        isAutoFilled: false
      }
    ]);
  }

  function updateLine(key, field, value) {
    setLineItems(
      lineItems.map((line) => {
        if (line.key !== key) return line;
        if (line.cobEntryId) return line;
        const updated = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
        }
        if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
          updated.vatAmount = Number(updated.amount || 0) * (Number(updated.vatRate || 0) / 100);
        }
        return updated;
      })
    );
  }

  function removeLine(key) {
    setLineItems(lineItems.filter((line) => line.key !== key));
  }

  const totalAmount = lineItems.reduce((sum, line) => sum + Number(line.amount || 0) - Number(line.creditAmount || 0) + Number(line.vatAmount || 0), 0);
  const editingDescriptionLine = lineItems.find((line) => line.key === descriptionModal.lineKey);

  const groupedLineItems = useMemo(() => {
    const groups = selectedJobs.map((job) => ({
      key: job.backendId,
      job,
      title: job.job_no || job.id || `Job #${job.backendId}`,
      lines: lineItems.filter((line) => line.jobId === job.backendId)
    }));
    const unassigned = lineItems.filter((line) => !selectedJobIds?.includes(line.jobId));
    if (unassigned.length) {
      groups.push({ key: 'unassigned', job: null, title: t('debitNotes.unassignedLines'), lines: unassigned });
    }
    return groups;
  }, [lineItems, selectedJobs, selectedJobIds, t]);

  const legacyLineColumns = [
    {
      title: t('debitNotes.jobNo'),
      dataIndex: 'jobId',
      width: 150,
      render: (value, record) => (
        <Select
          value={value}
          size="small"
          allowClear
          options={selectedJobOptions}
          placeholder={t('debitNotes.selectJob')}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'jobId', v)}
        />
      )
    },
    {
      title: t('debitNotes.serviceType'),
      dataIndex: 'serviceType',
      width: 130,
      render: (value, record) => (
        <Input
          value={value}
          size="small"
          placeholder="CUSTOMS"
          onChange={(e) => updateLine(record.key, 'serviceType', e.target.value)}
        />
      )
    },
    {
      title: t('debitNotes.lineDescription'),
      dataIndex: 'description',
      render: (value, record) => (
        <Space size={4} style={{ width: '100%' }}>
          <Input
            value={value}
            size="small"
            placeholder={t('debitNotes.descriptionPlaceholder')}
            onChange={(e) => updateLine(record.key, 'description', e.target.value)}
            style={{ flex: 1 }}
          />
          {record.isAutoFilled && (
            <Tooltip title={t('debitNotes.autoFilledFromPricing')}>
              <ThunderboltOutlined style={{ color: '#faad14', fontSize: 14 }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: t('debitNotes.qty'),
      dataIndex: 'quantity',
      width: 80,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={1}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'quantity', v)}
        />
      )
    },
    {
      title: t('debitNotes.chargeNote'),
      dataIndex: 'chargeNote',
      width: 150,
      render: (value, record) => (
        <Input
          value={value}
          size="small"
          placeholder="4,100,000 VND/40"
          onChange={(e) => updateLine(record.key, 'chargeNote', e.target.value)}
        />
      )
    },
    {
      title: t('debitNotes.unitPrice'),
      dataIndex: 'unitPrice',
      width: 140,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'unitPrice', v)}
        />
      )
    },
    {
      title: t('debitNotes.lineAmount'),
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value) => <strong>{formatCurrency(value)}</strong>
    },
    {
      title: t('debitNotes.credit'),
      dataIndex: 'creditAmount',
      width: 120,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'creditAmount', v)}
        />
      )
    },
    {
      title: t('debitNotes.vatPercent'),
      dataIndex: 'vatRate',
      width: 90,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'vatRate', v)}
        />
      )
    },
    {
      title: t('debitNotes.vat'),
      dataIndex: 'vatAmount',
      width: 110,
      align: 'right',
      render: (value) => <strong>{formatCurrency(value)}</strong>
    },
    {
      title: t('debitNotes.lineNote'),
      dataIndex: 'lineNote',
      width: 150,
      render: (value, record) => (
        <Input
          value={value}
          size="small"
          placeholder="20833 / ghi chÃº"
          onChange={(e) => updateLine(record.key, 'lineNote', e.target.value)}
        />
      )
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
        />
      )
    }
  ];

  const lineColumns = [
    {
      title: t('debitNotes.jobNo'),
      dataIndex: 'jobId',
      width: 130,
      render: (value, record) => (
        <Select
          value={value}
          size="small"
          allowClear
          options={selectedJobOptions}
          placeholder={t('debitNotes.selectJob')}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'jobId', v)}
        />
      )
    },
    {
      title: t('debitNotes.lineDescription'),
      dataIndex: 'description',
      width: 330,
      render: (value, record) => (
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Space size={6} style={{ width: '100%' }}>
            <Input
              value={record.serviceType}
              size="small"
              placeholder={t('debitNotes.serviceType')}
              onChange={(e) => updateLine(record.key, 'serviceType', e.target.value)}
              style={{ width: 120 }}
            />
            <Typography.Text ellipsis style={{ flex: 1, maxWidth: 160 }}>
              {value || t('debitNotes.descriptionPlaceholder')}
            </Typography.Text>
            <Button size="small" onClick={() => setDescriptionModal({ open: true, lineKey: record.key })}>
              {t('debitNotes.editDescription')}
            </Button>
            {record.isAutoFilled && (
              <Tooltip title={t('debitNotes.autoFilledFromPricing')}>
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: 14 }} />
              </Tooltip>
            )}
          </Space>
          <Space size={6} style={{ width: '100%' }}>
            <Input
              value={record.chargeNote}
              size="small"
              placeholder="Charge note: 4,100,000 VND/40"
              onChange={(e) => updateLine(record.key, 'chargeNote', e.target.value)}
              style={{ width: 190 }}
            />
            <Input
              value={record.lineNote}
              size="small"
              placeholder="Note: 20833 / ghi chÃº"
              onChange={(e) => updateLine(record.key, 'lineNote', e.target.value)}
              style={{ flex: 1 }}
            />
          </Space>
        </Space>
      )
    },
    {
      title: t('debitNotes.qty'),
      dataIndex: 'quantity',
      width: 82,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={1}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'quantity', v)}
        />
      )
    },
    {
      title: t('debitNotes.unitPrice'),
      dataIndex: 'unitPrice',
      width: 120,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'unitPrice', v)}
        />
      )
    },
    {
      title: t('debitNotes.lineAmount'),
      dataIndex: 'amount',
      width: 115,
      align: 'right',
      render: (value) => <strong>{formatCurrency(value)}</strong>
    },
    {
      title: 'Credit',
      dataIndex: 'creditAmount',
      width: 105,
      render: (value, record) => (
        <InputNumber
          {...decimalInputProps}
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'creditAmount', v)}
        />
      )
    },
    {
      title: 'VAT',
      dataIndex: 'vatRate',
      width: 145,
      render: (value, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <InputNumber
            {...decimalInputProps}
            value={value}
            size="small"
            min={0}
            precision={2}
            addonAfter="%"
            style={{ width: '100%' }}
            onChange={(v) => updateLine(record.key, 'vatRate', v)}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatCurrency(record.vatAmount)}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: t('debitNotes.total'),
      key: 'lineTotal',
      width: 115,
      align: 'right',
      render: (_, record) => (
        <strong>{formatCurrency(Number(record.amount || 0) - Number(record.creditAmount || 0) + Number(record.vatAmount || 0))}</strong>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
        />
      )
    }
  ];

  const compactLineColumns = [
    {
      title: t('debitNotes.lineDescription'),
      dataIndex: 'description',
      width: 330,
      render: (value, record) => (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '96px minmax(0, 1fr) auto',
            gap: 8,
            alignItems: 'center',
            minHeight: 34
          }}
        >
          <Tag color="blue" style={{ marginInlineEnd: 0, textAlign: 'center' }}>
            {record.serviceType || t('debitNotes.serviceType')}
          </Tag>
          <Tooltip title={[value, record.chargeNote, record.lineNote].filter(Boolean).join('\n')}>
            <Typography.Text ellipsis style={{ maxWidth: 170 }}>
              {value || record.chargeNote || record.lineNote || t('debitNotes.descriptionPlaceholder')}
            </Typography.Text>
          </Tooltip>
          <Space size={4}>
            <Button size="small" onClick={() => setDescriptionModal({ open: true, lineKey: record.key })}>
              {t('debitNotes.editDescription')}
            </Button>
            {record.isAutoFilled && (
              <Tooltip title={t('debitNotes.autoFilledFromPricing')}>
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: 14 }} />
              </Tooltip>
            )}
          </Space>
        </div>
      )
    },
    ...lineColumns.slice(2)
  ];

  return (
    <>
      <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
        {t('debitNotes.lineItems')}
      </Divider>

      {selectedPartnerId && (
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('debitNotes.pricingHint')} ({suggestedPrices.length} {t('debitNotes.tariffAvailable')})
          </Typography.Text>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={applyPricing}
            disabled={!suggestedPrices.length}
            style={{ backgroundColor: suggestedPrices.length ? '#fffbe6' : undefined }}
          >
            {t('debitNotes.autoApplyPricing')}
          </Button>
        </div>
      )}

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {groupedLineItems.map((group) => {
          const groupTotal = group.lines.reduce((sum, line) => sum + Number(line.amount || 0) - Number(line.creditAmount || 0) + Number(line.vatAmount || 0), 0);
          return (
            <Card
              key={group.key}
              size="small"
              title={
                <Space>
                  <Tag color={group.job ? 'blue' : 'default'}>{group.title}</Tag>
                  <Typography.Text type="secondary">{group.lines.length} {t('debitNotes.lineItems').toLowerCase()}</Typography.Text>
                </Space>
              }
              extra={<Typography.Text strong>{formatCurrency(groupTotal)}</Typography.Text>}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={group.lines}
                columns={group.job ? compactLineColumns : [lineColumns[0], ...compactLineColumns]}
                rowKey="key"
                size="small"
                scroll={{ x: group.job ? 980 : 1120 }}
                pagination={false}
                footer={() => (
                  <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addEmptyLine(group.job?.backendId || null)}>
                    {t('debitNotes.addLine')}
                  </Button>
                )}
              />
            </Card>
          );
        })}
        {!groupedLineItems.length ? (
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => addEmptyLine()}>
            {t('debitNotes.addLine')}
          </Button>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography.Text strong style={{ fontSize: 14 }}>
            {t('debitNotes.total')}: {formatCurrency(totalAmount)}
          </Typography.Text>
        </div>
      </Space>

      <Modal
        title={t('debitNotes.editDescription')}
        open={descriptionModal.open}
        onCancel={() => setDescriptionModal({ open: false, lineKey: null })}
        onOk={() => setDescriptionModal({ open: false, lineKey: null })}
        width={680}
      >
        {editingDescriptionLine ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>{t('debitNotes.lineDescription')}</Typography.Text>
              <Input.TextArea
                rows={4}
                value={editingDescriptionLine.description}
                placeholder={t('debitNotes.descriptionPlaceholder')}
                onChange={(e) => updateLine(editingDescriptionLine.key, 'description', e.target.value)}
              />
            </div>
            <div>
              <Typography.Text strong>{t('debitNotes.chargeNote') || 'Charge Note'}</Typography.Text>
              <Input
                value={editingDescriptionLine.chargeNote}
                placeholder="4,100,000 VND/40"
                onChange={(e) => updateLine(editingDescriptionLine.key, 'chargeNote', e.target.value)}
              />
            </div>
            <div>
              <Typography.Text strong>{t('debitNotes.lineNote') || 'Note'}</Typography.Text>
              <Input.TextArea
                rows={3}
                value={editingDescriptionLine.lineNote}
                placeholder="Ghi chú nội bộ trên bảng kê"
                onChange={(e) => updateLine(editingDescriptionLine.key, 'lineNote', e.target.value)}
              />
            </div>
          </Space>
        ) : null}
      </Modal>
    </>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DebitNotesPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const userRoles = useAppSelector(selectUserRoles);
  const isAdmin = userRoles.map((role) => role.name || role).some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role));
  const [form] = Form.useForm();
  const [voidForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportingKey, setExportingKey] = useState(null);
  const [debtPreview, setDebtPreview] = useState(null);
  const exportingRef = useRef(new Set());

  const statusColor = {
    DRAFT: 'default',
    POSTED: 'blue',
    SENT: 'green',
    VOIDED: 'red'
  };

  const { data: notesData, isLoading: loading, error: loadErrorObj, refetch } = useGetDebitNotesQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData, refetch: refetchPartners } = useGetPartnersQuery();
  const { data: pricingData } = useGetServicePricesQuery();
  const [createDebitNote] = useCreateDebitNoteMutation();
  const [updateDebitNote] = useUpdateDebitNoteMutation();
  const [deleteDebitNote] = useDeleteDebitNoteMutation();
  const [postDebitNote] = usePostDebitNoteMutation();
  const [voidDebitNote] = useVoidDebitNoteMutation();
  const [sendDebitNote] = useSendDebitNoteMutation();
  const [recordDebitNotePayment] = useRecordDebitNotePaymentMutation();
  const [exportDebitNote] = useExportDebitNoteMutation();
  const [previewDebitDebt, { isLoading: previewingDebt }] = usePreviewDebitDebtMutation();
  const [getDebitNoteDetail] = useLazyGetDebitNoteByIdQuery();
  const { data: cobCandidates = [], isFetching: loadingCobCandidates } = useGetDebitCobCandidatesQuery(
    {
      partnerId: selectedPartnerId,
      jobIds: selectedJobIds,
      debitNoteId: editingRecord?.backendId
    },
    { skip: !modalOpen || !selectedPartnerId || !selectedJobIds.length }
  );

  const notes = useMemo(() => notesData?.items || [], [notesData]);
  const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
  const partners = useMemo(
    () => (partnersData?.items || []).filter((p) => p.isActive),
    [partnersData]
  );
  const partnersById = useMemo(
    () =>
      partners.reduce((result, partner) => {
        if (partner) result[partner.backendId] = partner;
        return result;
      }, {}),
    [partners]
  );
  const allPrices = useMemo(() => pricingData?.items || [], [pricingData]);
  const loadError = loadErrorObj ? t('debitNotes.loadError') : '';

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return notes;

    return notes.filter((n) => {
      const customer = partners.find((p) => p.backendId === n.raw?.partnerId);
      const noteJobIds = n.raw?.jobIds?.length ? n.raw.jobIds : [n.jobId].filter(Boolean);
      const jobCodes = noteJobIds
        .map((jobId) => jobs.find((j) => j.backendId === jobId)?.job_no)
        .filter(Boolean);
      
      const searchable = [
        customer?.name,
        customer?.code,
        ...jobCodes,
        n.description,
        `DN-${n.backendId}`
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [notes, search, partners, jobs]);

  const jobOptions = useMemo(
    () =>
      jobs
        .filter((job) => !selectedPartnerId || job.partnerId === selectedPartnerId || job.raw?.partnerId === selectedPartnerId)
        .map((job) => {
        const customerName = job.partnerId != null
          ? (partnersById[job.partnerId]?.name || job.customer || '')
          : (job.customer || '');

        return {
          value: job.backendId,
          label: `${job.job_no || job.id} - ${customerName}`
        };
      }),
    [jobs, partnersById, selectedPartnerId]
  );

  const customerOptions = useMemo(
    () =>
      partners
        .filter((p) => ['CUSTOMER', 'BOTH'].includes(p.partnerType))
        .map((p) => ({ value: p.backendId, label: `${p.code} - ${p.name}` })),
    [partners]
  );

  function handlePartnerChange(partnerId) {
    setSelectedPartnerId(partnerId || null);
    setSelectedJobIds([]);
    setLineItems([]);
    setDebtPreview(null);
    form.setFieldsValue({ jobIds: [] });
  }

  // Keep all selected jobs under the same customer.
  const handleJobChange = useCallback(
    (jobIds = []) => {
      setSelectedJobIds(jobIds);
      setDebtPreview(null);
      setLineItems((current) => current.filter((line) => !line.cobEntryId || jobIds.includes(line.jobId)));
      if (!jobIds.length) return;
      const job = jobs.find((j) => j.backendId === jobIds[0]);
      if (job?.raw?.partnerId) {
        form.setFieldsValue({ partnerId: job.raw.partnerId });
        setSelectedPartnerId(job.raw.partnerId);
      }
    },
    [jobs, form]
  );

  function openCreateModal() {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ currency: 'VND' });
    setLineItems([]);
    setSelectedPartnerId(null);
    setSelectedJobIds([]);
    setDebtPreview(null);
    setModalOpen(true);
  }

  async function openEditModal(record) {
    let source = record;
    try {
      source = await getDebitNoteDetail(record.backendId).unwrap();
    } catch (error) {
      message.error(getApiError(error, t, 'debitNotes.loadError'));
      return;
    }
    const jobIds = source.raw?.jobIds?.length ? source.raw.jobIds : [source.jobId].filter(Boolean);
    setEditingRecord(source);
    form.setFieldsValue({
      partnerId: source.raw?.partnerId,
      jobIds,
      currency: source.currency || 'VND',
      referenceNo: source.raw?.referenceNo,
      groupCode: source.raw?.groupCode,
      paymentTerm: source.raw?.paymentTerm,
      movingType: source.raw?.movingType,
      direction: source.raw?.direction,
      mblNo: source.raw?.mblNo,
      exportNote: source.raw?.exportNote,
      bankName: source.raw?.bankName,
      bankAccountNo: source.raw?.bankAccountNo,
      paymentMethod: source.raw?.paymentMethod,
      paymentAccountRef: source.raw?.paymentAccountRef,
      description: source.raw?.description || ''
    });
    setSelectedPartnerId(source.raw?.partnerId);
    setSelectedJobIds(jobIds);
    const existingLines = (source.raw?.lineItems || []).map((line, idx) => ({
      key: `edit-${Date.now()}-${idx}`,
      jobId: line.jobId || source.jobId,
      serviceType: line.serviceType || '',
      description: line.description || '',
      chargeNote: line.chargeNote || '',
      lineNote: line.lineNote || '',
      quantity: Number(line.quantity || 1),
      unitPrice: Number(line.unitPrice || 0),
      amount: Number(line.amount || 0),
      creditAmount: Number(line.creditAmount || 0),
      vatRate: Number(line.vatRate || 0),
      vatAmount: Number(line.vatAmount || 0),
      currency: line.currency || 'VND',
      pricingId: line.pricingId || null,
      cobEntryId: line.cobEntryId || null,
      isAutoFilled: false
    }));
    setLineItems(existingLines);
    setDebtPreview(null);
    setModalOpen(true);
  }

  const selectedCobIds = useMemo(
    () => lineItems.filter((line) => line.cobEntryId).map((line) => line.cobEntryId),
    [lineItems]
  );

  const serviceTotal = useMemo(
    () => lineItems.filter((line) => !line.cobEntryId).reduce((sum, line) => sum + Number(line.amount || 0) - Number(line.creditAmount || 0) + Number(line.vatAmount || 0), 0),
    [lineItems]
  );
  const cobTotal = useMemo(
    () => lineItems.filter((line) => line.cobEntryId).reduce((sum, line) => sum + Number(line.amount || 0), 0),
    [lineItems]
  );
  const formTotal = serviceTotal + cobTotal;

  function handleCobSelection(cobIds) {
    const selected = new Set(cobIds);
    const serviceLines = lineItems.filter((line) => !line.cobEntryId);
    const cobLines = cobCandidates
      .filter((cob) => selected.has(cob.id))
      .map((cob) => ({
        key: `cob-${cob.id}`,
        cobEntryId: cob.id,
        jobId: cob.jobId,
        serviceType: 'CHARGE_ON_BEHALF',
        description: cob.description || `Chi hộ #${cob.id}`,
        chargeNote: `Chi hộ #${cob.id}`,
        lineNote: '',
        quantity: 1,
        unitPrice: Number(cob.amount || 0),
        amount: Number(cob.amount || 0),
        creditAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        currency: cob.currency || 'VND',
        pricingId: null,
        isAutoFilled: true
      }));
    setLineItems([...serviceLines, ...cobLines]);
  }

  useEffect(() => {
    if (!modalOpen || !selectedPartnerId || !selectedJobIds.length || !lineItems.length) {
      return undefined;
    }
    const timeout = setTimeout(async () => {
      try {
        const result = await previewDebitDebt({
          partnerId: selectedPartnerId,
          jobId: selectedJobIds[0],
          jobIds: selectedJobIds,
          debitNoteId: editingRecord?.backendId,
          amount: formTotal,
          lineItems: lineItems.map(({ key, isAutoFilled, ...line }) => line)
        }).unwrap();
        setDebtPreview(result);
      } catch {
        setDebtPreview(null);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [modalOpen, selectedPartnerId, selectedJobIds, lineItems, editingRecord?.backendId, formTotal, previewDebitDebt]);

  async function submitEntry(values) {
    if (!lineItems.length) {
      message.warning(t('debitNotes.noLineItems'));
      return;
    }
    if (debtPreview?.exceedsLimit) {
      message.error(t('debitNotes.debtLimitExceeded'));
      return;
    }

    const quantityRangeError = validateLineItemQuantityRanges(lineItems, allPrices, t);
    if (quantityRangeError) {
      message.warning(quantityRangeError);
      return;
    }

    setSaving(true);
    try {
      const totalAmount = lineItems.reduce((sum, line) => sum + Number(line.amount || 0) - Number(line.creditAmount || 0) + Number(line.vatAmount || 0), 0);
      const jobIds = values.jobIds || [];

      const payload = {
        partnerId: values.partnerId,
        jobId: jobIds[0],
        jobIds,
        currency: values.currency,
        referenceNo: values.referenceNo || undefined,
        groupCode: values.groupCode || undefined,
        paymentTerm: values.paymentTerm || undefined,
        movingType: values.movingType || undefined,
        direction: values.direction || undefined,
        mblNo: values.mblNo || undefined,
        exportNote: values.exportNote || undefined,
        bankName: values.bankName || undefined,
        bankAccountNo: values.bankAccountNo || undefined,
        paymentMethod: values.paymentMethod || undefined,
        paymentAccountRef: values.paymentAccountRef || undefined,
        docDate: toDateString(values.docDate),
        dueDate: toDateString(values.dueDate),
        description: values.description || '',
        amount: totalAmount,
        lineItems: lineItems.map((line) => ({
          jobId: line.jobId || jobIds[0],
          serviceType: line.serviceType,
          description: line.description,
          chargeNote: line.chargeNote,
          lineNote: line.lineNote,
          quantity: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || 0),
          amount: Number(line.amount || 0),
          creditAmount: Number(line.creditAmount || 0),
          vatRate: Number(line.vatRate || 0),
          vatAmount: Number(line.vatAmount || 0),
          currency: line.currency,
          pricingId: line.pricingId || undefined,
          cobEntryId: line.cobEntryId || undefined
        }))
      };

      if (editingRecord) {
        await updateDebitNote({ id: editingRecord.backendId, ...payload }).unwrap();
        message.success(t('debitNotes.updateSuccess'));
      } else {
        await createDebitNote(payload).unwrap();
        message.success(t('debitNotes.createSuccess'));
      }
      setModalOpen(false);
      setEditingRecord(null);
      refetchPartners();
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(record) {
    try {
      await postDebitNote(record.backendId).unwrap();
      message.success(t('debitNotes.postSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.postError'));
    }
  }

  async function handleSend(record) {
    try {
      await sendDebitNote(record.backendId).unwrap();
      message.success(t('debitNotes.sendSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.sendError'));
    }
  }

  function openVoidModal(record) {
    setSelectedRecord(record);
    voidForm.resetFields();
    setVoidModalOpen(true);
  }

  function openPaymentModal(record) {
    setSelectedRecord(record);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: Math.max(Number(record.amount || 0) - Number(record.raw?.paidAmount || 0), 0),
      paymentMethod: record.raw?.paymentMethod || 'BANK',
      paymentAccountRef: record.raw?.paymentAccountRef
    });
    setPaymentModalOpen(true);
  }

  async function handleRecordPayment(values) {
    setSaving(true);
    try {
      await recordDebitNotePayment({
        id: selectedRecord.backendId,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        paymentAccountRef: values.paymentAccountRef || undefined,
        paymentDate: toDateString(values.paymentDate)
      }).unwrap();
      message.success(t('debitNotes.paymentRecorded'));
      setPaymentModalOpen(false);
      setSelectedRecord(null);
      refetchPartners();
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.paymentRecordError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(values) {
    setSaving(true);
    try {
      await voidDebitNote({ id: selectedRecord.backendId, reason: values.reason }).unwrap();
      message.success(t('debitNotes.voidSuccess'));
      setVoidModalOpen(false);
      setSelectedRecord(null);
      refetchPartners();
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.voidError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(record, format) {
    const key = `${record.backendId}-${format}`;
    if (exportingRef.current.has(key)) return;
    exportingRef.current.add(key);
    setExportingKey(key);
    try {
      const blob = await exportDebitNote({ id: record.backendId, format }).unwrap();
      const isExcel = format === 'excel';
      const type = isExcel
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const extension = isExcel ? 'xlsx' : 'pdf';
      const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DN-${record.backendId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(getApiError(err, t, 'debitNotes.loadError'));
    } finally {
      exportingRef.current.delete(key);
      setExportingKey((current) => (current === key ? null : current));
    }
  }

  const columns = [
    {
      title: t('debitNotes.noteNo'),
      dataIndex: 'backendId',
      key: 'backendId',
      width: 80,
      render: (value) => <strong>DN-{value}</strong>
    },
    {
      title: t('debitNotes.customer'),
      key: 'customer',
      width: 200,
      render: (_, record) => {
        const customer = partners.find((p) => p.backendId === record.raw?.partnerId);
        return customer?.name || '-';
      }
    },
    {
      title: t('debitNotes.jobNo'),
      key: 'job_no',
      width: 140,
      render: (_, record) => {
        const jobIds = record.raw?.jobIds?.length ? record.raw.jobIds : [record.jobId].filter(Boolean);
        const jobCodes = jobIds
          .map((jobId) => jobs.find((j) => j.backendId === jobId)?.job_no || `Job #${jobId}`)
          .filter(Boolean);
        return jobCodes.join(', ') || record.job_no || '-';
      }
    },
    {
      title: t('debitNotes.amount'),
      key: 'amount',
      align: 'right',
      width: 150,
      render: (_, record) => <strong>{formatCurrency(record.amount)} {record.currency}</strong>
    },
    {
      title: t('debitNotes.paymentMethod'),
      key: 'paymentMethod',
      width: 140,
      render: (_, record) => {
        const method = record.raw?.paymentMethod;
        if (!method) return '-';
        return method === 'CASH' ? t('debitNotes.paymentMethodCash') : t('debitNotes.paymentMethodBank');
      }
    },
    {
      title: t('debitNotes.docDate'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val) => formatDate(val, language)
    },
    {
      title: t('debitNotes.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (val) => formatDate(val, language)
    },
    {
      title: t('debitNotes.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => {
        const raw = value?.toUpperCase().replace(/\s/g, '_');
        const dnStatusLabel = {
          DRAFT: t('debitNotes.statusDraft'),
          POSTED: t('debitNotes.statusPosted'),
          SENT: t('debitNotes.statusSent'),
          VOIDED: t('debitNotes.statusVoided')
        };
        return <Tag color={statusColor[raw] || 'default'}>{dnStatusLabel[raw] || value}</Tag>;
      }
    },
    {
      title: t('debitNotes.paymentStatus'),
      key: 'paymentStatus',
      width: 130,
      render: (_, record) => {
        const status = record.raw?.paymentStatus || 'UNPAID';
        const labels = {
          UNPAID: t('debitNotes.paymentUnpaid'),
          PARTIAL: t('debitNotes.paymentPartial'),
          PAID: t('debitNotes.paymentPaid')
        };
        const colors = { UNPAID: 'orange', PARTIAL: 'blue', PAID: 'green' };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      }
    },
    {
      title: t('debitNotes.actions'),
      key: 'actions',
      width: 280,
      render: (_, record) => {
        const raw = record.status?.toUpperCase().replace(/\s/g, '_');
        const isDraft = raw === 'DRAFT';
        const isPosted = raw === 'POSTED';
        const isPaid = record.raw?.paymentStatus === 'PAID';
        const isLocked = Boolean(record.raw?.lockedAt);
        const canEdit = isDraft || (isLocked && isAdmin && !isPaid && raw !== 'VOIDED');
        const canDelete = isDraft && !isLocked;

        return (
          <Space>
            <Button
              size="small"
              icon={<FileExcelOutlined />}
              title={t('debitNotes.exportExcel') || 'Export Excel'}
              loading={exportingKey === `${record.backendId}-excel`}
              disabled={exportingKey === `${record.backendId}-pdf`}
              onClick={(event) => {
                event.stopPropagation();
                handleExport(record, 'excel');
              }}
            />
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              title={t('debitNotes.exportPdf') || 'Export PDF'}
              loading={exportingKey === `${record.backendId}-pdf`}
              disabled={exportingKey === `${record.backendId}-excel`}
              onClick={(event) => {
                event.stopPropagation();
                handleExport(record, 'pdf');
              }}
            />
            {canEdit && (
              <Button size="small" icon={<EditOutlined />} title={t('debitNotes.edit')} onClick={() => openEditModal(record)} />
            )}
            {canDelete && (
              <>
                <Popconfirm title={t('debitNotes.deleteConfirm')} onConfirm={async () => {
                  try {
                    await deleteDebitNote(record.backendId).unwrap();
                    message.success(t('debitNotes.deleteSuccess'));
                  } catch (err) {
                    message.error(getApiError(err, t, 'debitNotes.deleteError'));
                  }
                }}>
                  <Button size="small" danger icon={<DeleteOutlined />} title={t('debitNotes.delete')} />
                </Popconfirm>
              </>
            )}
            {isDraft && (
              <Popconfirm title={t('debitNotes.postConfirm')} onConfirm={() => handlePost(record)}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} title={t('debitNotes.post')} />
              </Popconfirm>
            )}
            {
              isPosted && (
                <Popconfirm title={t('debitNotes.sendConfirm')} onConfirm={() => handleSend(record)}>
                  <Button size="small" icon={<SendOutlined />} title={t('debitNotes.send')} />
                </Popconfirm>
              )
            }
            {
              !isPaid && raw !== 'VOIDED' && (
                <Button size="small" icon={<CheckCircleOutlined />} title={t('debitNotes.recordPayment')} onClick={() => openPaymentModal(record)} />
              )
            }
            {
              (isDraft || isPosted) && (
                <Button danger size="small" icon={<CloseCircleOutlined />} title={t('debitNotes.void')} onClick={() => openVoidModal(record)} />
              )
            }
          </Space >
        );
      }
    }
  ];

  const totalAmount = notes.reduce((sum, n) => sum + Number(n.amount || 0), 0);
  const draftCount = notes.filter((n) => n.status?.toUpperCase() === 'DRAFT').length;
  const postedCount = notes.filter((n) => n.status?.toUpperCase() === 'POSTED').length;
  const sentCount = notes.filter((n) => n.status?.toUpperCase() === 'SENT').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('debitNotes.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('debitNotes.subtitle')}
          </Typography.Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('common.refresh')}</Button>
          <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
            {t('debitNotes.create')}
          </Button>
        </Space>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.totalValue')} value={totalAmount} formatter={(v) => formatCurrency(v)} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.drafts')} value={draftCount} valueStyle={{ color: '#8c8c8c' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.posted')} value={postedCount} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.sent')} value={sentCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <FilterCard
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder={t('debitNotes.searchPlaceholder')}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all', label: t('debitNotes.allStatuses') },
          { value: 'DRAFT', label: t('debitNotes.statusDraft') },
          { value: 'POSTED', label: t('debitNotes.statusPosted') },
          { value: 'SENT', label: t('debitNotes.statusSent') },
          { value: 'VOIDED', label: t('debitNotes.statusVoided') }
        ]}
        showDateRange={false}
      />

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={filteredNotes}
          scroll={{ x: 1220 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* â”€â”€ Create Modal with Auto-Pricing â”€â”€ */}
      <Modal
        title={
          <Space>
            <FileAddOutlined />
            {editingRecord ? t('debitNotes.editTitle') : t('debitNotes.createTitle')}
          </Space>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={1120}
      >
        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 }}>
        <Form form={form} layout="vertical" onFinish={submitEntry}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="partnerId" label={t('debitNotes.customer')} rules={[{ required: true, message: t('debitNotes.customerRequired') }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={customerOptions}
                  placeholder={t('debitNotes.customerFromJob')}
                  onChange={handlePartnerChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="jobIds" label={t('debitNotes.jobNo')} rules={[{ required: true, message: t('debitNotes.jobRequired') }]}>
                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={jobOptions}
                  placeholder={t('debitNotes.selectJob')}
                  onChange={handleJobChange}
                  disabled={!selectedPartnerId}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label={t('debitNotes.currency')} rules={[{ required: true }]}>
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="paymentMethod" label={t('debitNotes.paymentMethod')}>
                <Select
                  allowClear
                  options={paymentMethodOptions.map((option) => ({
                    value: option.value,
                    label: t(option.labelKey)
                  }))}
                  placeholder={t('debitNotes.selectPaymentMethod')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="paymentAccountRef" label={t('debitNotes.paymentAccountRef')}>
                <Input placeholder={t('debitNotes.paymentAccountRefPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '8px 0 16px' }}>
            {t('debitNotes.pdfInfoSection')}
          </Divider>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="referenceNo" label={t('debitNotes.referenceNo')}>
                <Input placeholder="Invoice0626/2144" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="groupCode" label={t('debitNotes.groupCode')}>
                <Input placeholder="10366" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="paymentTerm" label={t('debitNotes.paymentTermLabel')}>
                <Input placeholder="At sight" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="mblNo" label={t('debitNotes.mblNo')}>
                <Input placeholder="MBL / Bill No." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="movingType" label={t('debitNotes.movingType')}>
                <Input placeholder="Ground" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="direction" label={t('debitNotes.direction')}>
                <Input placeholder="Logistics" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bankName" label={t('debitNotes.bankName')}>
                <Input placeholder={t('debitNotes.bankName')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="bankAccountNo" label={t('debitNotes.bankAccountNo')}>
                <Input placeholder={t('debitNotes.bankAccountNo')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name="exportNote" label={t('debitNotes.exportNote')}>
                <Input placeholder={t('debitNotes.exportNote')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="docDate" label={t('debitNotes.docDate')}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dueDate" label={t('debitNotes.dueDate')}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={t('debitNotes.description')}>
            <Input placeholder={t('debitNotes.descriptionPlaceholder')} />
          </Form.Item>
        </Form>

        {selectedJobIds.length ? (
          <Card
            size="small"
            title={t('debitNotes.cobCandidates')}
            style={{ marginBottom: 16 }}
          >
            <Typography.Paragraph type="secondary">
              {t('debitNotes.cobCandidatesHint')}
            </Typography.Paragraph>
            <Table
              size="small"
              rowKey="id"
              loading={loadingCobCandidates}
              dataSource={cobCandidates}
              pagination={false}
              locale={{ emptyText: t('debitNotes.noCobCandidates') }}
              rowSelection={{ selectedRowKeys: selectedCobIds, onChange: handleCobSelection }}
              columns={[
                {
                  title: t('debitNotes.jobNo'),
                  dataIndex: 'jobId',
                  render: (jobId) => jobs.find((job) => job.backendId === jobId)?.job_no || `Job #${jobId}`
                },
                { title: t('debitNotes.description'), dataIndex: 'description' },
                {
                  title: t('debitNotes.amount'),
                  dataIndex: 'amount',
                  align: 'right',
                  render: (amount, record) => `${formatCurrency(amount)} ${record.currency || 'VND'}`
                }
              ]}
            />
          </Card>
        ) : null}

        {/* Line Items with Auto-Pricing */}
        <LineItemsEditor
          lineItems={lineItems}
          setLineItems={setLineItems}
          allPrices={allPrices}
          selectedPartnerId={selectedPartnerId}
          selectedJobIds={selectedJobIds}
          jobs={jobs}
          t={t}
          message={message}
        />

        <Card size="small" title={t('debitNotes.debtPreview')} style={{ marginTop: 16 }} loading={previewingDebt}>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}><Statistic title={t('debitNotes.serviceTotal')} value={serviceTotal} formatter={formatCurrency} /></Col>
            <Col xs={12} md={6}><Statistic title={t('debitNotes.cobTotal')} value={cobTotal} formatter={formatCurrency} /></Col>
            <Col xs={12} md={6}><Statistic title={t('debitNotes.currentDebt')} value={debtPreview?.currentDebt || 0} formatter={formatCurrency} /></Col>
            <Col xs={12} md={6}><Statistic title={t('debitNotes.projectedDebt')} value={debtPreview?.projectedDebt || formTotal} formatter={formatCurrency} /></Col>
          </Row>
          {debtPreview?.hasPolicy ? (
            <Alert
              style={{ marginTop: 12 }}
              type={debtPreview.exceedsLimit ? 'error' : 'success'}
              showIcon
              message={debtPreview.exceedsLimit
                ? t('debitNotes.debtExceededBy', { amount: formatCurrency(debtPreview.exceededBy) })
                : t('debitNotes.availableLimit', { amount: formatCurrency(Math.max(debtPreview.availableLimit || 0, 0)) })}
            />
          ) : (
            <Alert style={{ marginTop: 12 }} type="info" showIcon message={t('debitNotes.noDebtPolicy')} />
          )}
        </Card>
        </div>
      </Modal>

      <Modal
        title={t('debitNotes.recordPayment')}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={() => paymentForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleRecordPayment}>
          <Form.Item name="amount" label={t('debitNotes.paymentAmount')} rules={[{ required: true, message: t('debitNotes.amountRequired') }]}>
            <InputNumber {...decimalInputProps} min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t('debitNotes.paymentMethod')} rules={[{ required: true, message: t('debitNotes.selectPaymentMethod') }]}>
            <Select
              options={paymentMethodOptions.map((option) => ({
                value: option.value,
                label: t(option.labelKey)
              }))}
            />
          </Form.Item>
          <Form.Item name="paymentAccountRef" label={t('debitNotes.paymentAccountRef')}>
            <Input placeholder={t('debitNotes.paymentAccountRefPlaceholder')} />
          </Form.Item>
          <Form.Item name="paymentDate" label={t('debitNotes.paymentDate')}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Void Modal */}
      <Modal
        title={t('debitNotes.voidTitle')}
        open={voidModalOpen}
        onCancel={() => setVoidModalOpen(false)}
        onOk={() => voidForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
        okButtonProps={{ danger: true }}
        okText={t('debitNotes.void')}
      >
        <Form form={voidForm} layout="vertical" onFinish={handleVoid}>
          <Form.Item
            name="reason"
            label={t('debitNotes.voidReason')}
            rules={[{ required: true, message: t('debitNotes.voidReasonRequired') }]}
          >
            <Input.TextArea rows={3} placeholder={t('debitNotes.voidReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
