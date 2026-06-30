'use client';

import { Tag } from 'antd';
import { useLanguage } from '@/components/AppProviders';

/**
 * Mapping mặc định giữa status label → Ant Design Tag color.
 * Cover cả Jobs, Accounting, Partners, Users status values.
 */
const DEFAULT_COLOR_MAP = {
  // Job statuses
  New: 'default',
  Draft: 'default',
  'In Progress': 'green',
  InProgress: 'green',
  Completed: 'success',
  Closed: 'red',
  Pending: 'warning',
  Cancelled: 'error',
  Canceled: 'error',

  // Accounting statuses
  Posted: 'green',
  Voided: 'red',
  Reversed: 'orange',

  // Payment statuses
  Paid: 'green',
  Partial: 'gold',
  Unpaid: 'red',
  Issued: 'processing',

  // Active / Inactive
  Active: 'green',
  Inactive: 'red',
  Locked: 'red',

  // Debt statuses (raw enum keys)
  normal    : 'success',   // Bình thường
  near_limit: 'gold',      // Sắp chạm hạn mức
  over_limit: 'error',     // Vượt hạn mức
  overdue   : 'magenta',   // Có nợ quá hạn

  // Debt statuses (formatted labels — dùng khi caller truyền label đã format)
  'Bình thường'      : 'success',
  'Sắp chạm hạn mức': 'gold',
  'Vượt hạn mức'    : 'error',
  'Có nợ quá hạn'   : 'magenta'
};

/**
 * StatusTag — component hiển thị status dạng Tag với màu sắc tự động.
 *
 * Props:
 *   value    — Giá trị status (string)
 *   colorMap — Custom mapping (optional, merge với default)
 *   ...rest  — Truyền thêm props cho Ant Design Tag
 *
 * Usage:
 *   <StatusTag value="In Progress" />
 *   <StatusTag value={record.status} />
 *   <StatusTag value="Custom" colorMap={{ Custom: 'purple' }} />
 */
export default function StatusTag({ value, colorMap, ...rest }) {
  const mergedMap = colorMap ? { ...DEFAULT_COLOR_MAP, ...colorMap } : DEFAULT_COLOR_MAP;
  const color = mergedMap[value] || 'default';

  return (
    <Tag color={color} {...rest}>
      {value || '-'}
    </Tag>
  );
}

/**
 * ActiveStatusTag — shorthand cho hiển thị trạng thái Active/Inactive.
 *
 * Usage:
 *   <ActiveStatusTag value={record.isActive} />
 */
export function ActiveStatusTag({ value, ...rest }) {
  const { t } = useLanguage();

  return (
    <Tag color={value ? 'green' : 'red'} {...rest}>
      {value ? t('statusTag.active') : t('statusTag.inactive')}
    </Tag>
  );
}
