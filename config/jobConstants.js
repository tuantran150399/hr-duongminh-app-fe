/**
 * Job form select options — dùng chung cho Jobs Create và Jobs Detail.
 *
 * Import:
 *   import { jobTypeOptions, shipmentModeOptions, ... } from '@/config/jobConstants';
 */

export const jobTypeOptions = [
  { value: 'IMPORT', label: 'Import' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'DOMESTIC', label: 'Domestic' }
];

export const shipmentModeOptions = [
  { value: 'SEA_FCL', label: 'Sea FCL' },
  { value: 'SEA_LCL', label: 'Sea LCL' },
  { value: 'AIR', label: 'Air' },
  { value: 'ROAD', label: 'Road' },
  { value: 'RAIL', label: 'Rail' }
];

export const jobStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export const customsLaneOptions = [
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
  { value: 'RED', label: 'Red' }
];

export const cargoTypeOptions = [
  { value: 'FCL', label: 'FCL' },
  { value: 'LCL', label: 'LCL' },
  { value: 'AIR', label: 'Air' },
  { value: 'BULK', label: 'Bulk cargo' }
];

/** Terminal statuses — job ở trạng thái này không cho phép edit */
export const TERMINAL_STATUSES = ['CLOSED', 'CANCELLED'];

/** Date fields cần convert khi submit job form */
export const JOB_DATE_FIELDS = ['etd', 'eta', 'atd', 'ata', 'actualDeliveryDate'];
