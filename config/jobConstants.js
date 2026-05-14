/**
 * Job form select options — dùng chung cho Jobs Create và Jobs Detail.
 * Sử dụng translation function t() để hỗ trợ đa ngôn ngữ.
 *
 * Import:
 *   import { getJobTypeOptions, getShipmentModeOptions, ... } from '@/config/jobConstants';
 */

export function getJobTypeOptions(t) {
  return [
    { value: 'IMPORT', label: t('jobForm.jobTypeImport') },
    { value: 'EXPORT', label: t('jobForm.jobTypeExport') },
    { value: 'DOMESTIC', label: t('jobForm.jobTypeDomestic') }
  ];
}

export function getShipmentModeOptions(t) {
  return [
    { value: 'SEA_FCL', label: t('jobForm.shipmentSeaFcl') },
    { value: 'SEA_LCL', label: t('jobForm.shipmentSeaLcl') },
    { value: 'AIR', label: t('jobForm.shipmentAir') },
    { value: 'ROAD', label: t('jobForm.shipmentRoad') },
    { value: 'RAIL', label: t('jobForm.shipmentRail') }
  ];
}

export function getJobStatusOptions(t) {
  return [
    { value: 'DRAFT', label: t('jobForm.statusDraft') },
    { value: 'IN_PROGRESS', label: t('jobForm.statusInProgress') },
    { value: 'CLOSED', label: t('jobForm.statusClosed') },
    { value: 'CANCELLED', label: t('jobForm.statusCancelled') }
  ];
}

export function getCustomsLaneOptions(t) {
  return [
    { value: 'GREEN', label: t('jobForm.laneGreen') },
    { value: 'YELLOW', label: t('jobForm.laneYellow') },
    { value: 'RED', label: t('jobForm.laneRed') }
  ];
}

export function getCargoTypeOptions(t) {
  return [
    { value: 'FCL', label: t('jobForm.cargoFcl') },
    { value: 'LCL', label: t('jobForm.cargoLcl') },
    { value: 'AIR', label: t('jobForm.cargoAir') },
    { value: 'BULK', label: t('jobForm.cargoBulk') }
  ];
}

/** Terminal statuses — job ở trạng thái này không cho phép edit */
export const TERMINAL_STATUSES = ['CLOSED', 'CANCELLED'];

/** Date fields cần convert khi submit job form */
export const JOB_DATE_FIELDS = ['etd', 'eta', 'atd', 'ata', 'actualDeliveryDate'];
