/**
 * Map raw NestJS error messages (English) → translation keys.
 *
 * The backend throws standard NestJS exceptions with English messages.
 * This map allows the frontend to translate them without modifying the backend.
 *
 * Usage:
 *   import { getApiError } from '@/utils/getApiError';
 *   message.error(getApiError(err, t, 'jobForm.createError'));
 */

const MESSAGE_TO_KEY = {
  // ── Jobs ──────────────────────────────────────────────
  'Job code already exists': 'apiErrors.JOB_CODE_DUPLICATE',
  'Job not found': 'apiErrors.JOB_NOT_FOUND',
  'Cannot edit a CLOSED or CANCELLED job': 'apiErrors.JOB_CANNOT_EDIT_FINALIZED',
  'Job is already finalized': 'apiErrors.JOB_ALREADY_FINALIZED',
  'This job already has receipt/payment documents and cannot be edited': 'apiErrors.JOB_HAS_ACCOUNTING_DOCUMENTS',
  'Only admin can edit a confirmed job': 'apiErrors.JOB_CONFIRMED_ADMIN_ONLY',
  'Only admin can edit a confirmed job that already has debit notes': 'apiErrors.JOB_CONFIRMED_DEBIT_NOTE_ADMIN_ONLY',
  'Editing this confirmed job will lock existing debit notes. Please confirm before saving': 'apiErrors.JOB_DEBIT_NOTE_LOCK_CONFIRM_REQUIRED',
  'Cannot delete/archive a job that already has debit notes, debt, or accounting documents': 'apiErrors.JOB_ARCHIVE_BLOCKED_BY_DOCUMENTS',
  'Customer exceeds configured debt limit': 'apiErrors.DEBT_LIMIT_EXCEEDED',
  'Customer has overdue debt beyond configured policy': 'apiErrors.DEBT_OVERDUE',
  'Milestone not found': 'apiErrors.MILESTONE_NOT_FOUND',
  'Assigned user does not belong to the job branch': 'apiErrors.USER_BRANCH_MISMATCH',

  // ── Partners ──────────────────────────────────────────
  'Partner code already exists': 'apiErrors.PARTNER_CODE_DUPLICATE',
  'Partner not found': 'apiErrors.PARTNER_NOT_FOUND',

  // ── Users ─────────────────────────────────────────────
  'Username or email already taken': 'apiErrors.USERNAME_EMAIL_DUPLICATE',
  'Email already taken': 'apiErrors.EMAIL_DUPLICATE',
  'User not found': 'apiErrors.USER_NOT_FOUND',
  'Current password is incorrect': 'apiErrors.CURRENT_PASSWORD_INCORRECT',

  // ── Roles ─────────────────────────────────────────────
  'Role name already exists': 'apiErrors.ROLE_NAME_DUPLICATE',
  'Role not found': 'apiErrors.ROLE_NOT_FOUND',

  // ── Branches / Access ─────────────────────────────────
  'You cannot access data from another branch': 'apiErrors.BRANCH_ACCESS_DENIED',

  // ── Treasury ──────────────────────────────────────────
  'Cash account code already exists': 'apiErrors.CASH_ACCOUNT_CODE_DUPLICATE',
  'Cash account not found': 'apiErrors.CASH_ACCOUNT_NOT_FOUND',
  'Active cash account not found': 'apiErrors.CASH_ACCOUNT_INACTIVE',
  'Cash account balance cannot be negative': 'apiErrors.CASH_BALANCE_NEGATIVE',

  // ── Security ──────────────────────────────────────────
  'Access from this IP address is blocked': 'apiErrors.IP_BLOCKED',
  'Access from this IP address is not allowed': 'apiErrors.IP_NOT_ALLOWED',
  'Security alert not found': 'apiErrors.SECURITY_ALERT_NOT_FOUND',
  'IP access rule not found': 'apiErrors.IP_RULE_NOT_FOUND',

  // ── Payment Requests ──────────────────────────────────
  'Payment request not found': 'apiErrors.PAYMENT_REQUEST_NOT_FOUND',
  'You cannot access payment requests from another branch': 'apiErrors.PAYMENT_REQUEST_BRANCH_ACCESS_DENIED',
  'Payment request branch must match the selected job branch': 'apiErrors.PAYMENT_REQUEST_BRANCH_MISMATCH',
  'Only pending payment requests can be approved': 'apiErrors.PAYMENT_REQUEST_NOT_PENDING',
  'Payment request must be department-approved first': 'apiErrors.PAYMENT_REQUEST_NEED_DEPT_APPROVAL',
  'Payment request is already finalized': 'apiErrors.PAYMENT_REQUEST_FINALIZED',
  'Invalid payment request transition': 'apiErrors.PAYMENT_REQUEST_INVALID_TRANSITION',
  'Job is required when marking a payment request as charge-on-behalf': 'apiErrors.COB_JOB_REQUIRED',
  'Customer is required for charge-on-behalf': 'apiErrors.COB_CUSTOMER_REQUIRED',

  // ── Notifications ─────────────────────────────────────
  'Notification not found': 'apiErrors.NOTIFICATION_NOT_FOUND',

  // ── Pricing ───────────────────────────────────────────
  'Service price not found': 'apiErrors.SERVICE_PRICE_NOT_FOUND',
  'The uploaded file does not contain any data rows': 'apiErrors.IMPORT_EMPTY_FILE',
  'No file uploaded': 'apiErrors.NO_FILE_UPLOADED',
  'File exceeds 10 MB limit': 'apiErrors.FILE_TOO_LARGE',
  'serviceType is required': 'apiErrors.SERVICE_TYPE_REQUIRED',

  // ── Reports ───────────────────────────────────────────
  'Job is required for debt statistics': 'apiErrors.REPORT_JOB_REQUIRED',
};

/**
 * Regex patterns for dynamic messages like "Partner #123 not found".
 * Each entry: [regex, translationKey]
 */
const DYNAMIC_PATTERNS = [
  [/^Partner #\d+ not found$/, 'apiErrors.PARTNER_NOT_FOUND'],
  [/^Agent #\d+ not found$/, 'apiErrors.AGENT_NOT_FOUND'],
  [/^Branch #\d+ not found$/, 'apiErrors.BRANCH_NOT_FOUND'],
  [/^User #\d+ not found$/, 'apiErrors.USER_NOT_FOUND'],
  [/^User #\d+ is inactive$/, 'apiErrors.USER_INACTIVE'],
  [/^Vendor #\d+ not found$/, 'apiErrors.VENDOR_NOT_FOUND'],
  [/^Customer #\d+ not found$/, 'apiErrors.CUSTOMER_NOT_FOUND'],
  [/^Job #\d+ not found$/, 'apiErrors.JOB_NOT_FOUND'],
  [/^Partner code ".+" not found$/, 'apiErrors.PARTNER_NOT_FOUND'],
  [/^Unsupported serviceType ".+"$/, 'apiErrors.SERVICE_TYPE_UNSUPPORTED'],
  [/^Unsupported report export ".+"$/, 'apiErrors.REPORT_UNSUPPORTED'],
];

/**
 * Translate a backend API error to the current UI language.
 *
 * Priority:
 *  1. Exact match in MESSAGE_TO_KEY → use translated string
 *  2. Dynamic regex match → use translated string
 *  3. Fallback to the raw backend message (if any)
 *  4. Fallback to the provided translation key
 *
 * @param {object} err  - RTK Query error object (err from catch)
 * @param {Function} t  - Translation function from useLanguage()
 * @param {string} fallbackKey - Translation key for generic fallback
 * @returns {string}
 */
export function getApiError(err, t, fallbackKey) {
  const rawMessage =
    typeof err?.data?.message === 'string'
      ? err.data.message
      : Array.isArray(err?.data?.message)
        ? err.data.message[0]
        : null;

  if (rawMessage) {
    // 1. Exact match
    const exactKey = MESSAGE_TO_KEY[rawMessage];
    if (exactKey) {
      const translated = t(exactKey);
      if (translated !== exactKey) return translated;
    }

    // 2. Dynamic pattern match
    for (const [regex, key] of DYNAMIC_PATTERNS) {
      if (regex.test(rawMessage)) {
        const translated = t(key);
        if (translated !== key) return translated;
      }
    }
  }

  // 3 & 4. Fallback
  return rawMessage || t(fallbackKey);
}
