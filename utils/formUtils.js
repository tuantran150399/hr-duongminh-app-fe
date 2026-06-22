/**
 * Shared form utility functions — dùng chung cho tất cả pages có form.
 *
 * Rule: Nếu thao tác validate/format, check các utils (ví dụ utils/format.js) trước khi thêm mới 1 hàm nào đó.
 *
 * Import:
 *   import { cleanPayload, toDateString, toDatePickerValue } from '@/utils/formUtils';
 */
import dayjs from 'dayjs';
import { formatNumberExcel } from './format';
/**
 * Loại bỏ các field có giá trị undefined / null / '' khỏi payload
 * trước khi gửi lên backend.
 */
export function cleanPayload(values) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

/**
 * Chuyển giá trị DatePicker (dayjs) → string YYYY-MM-DD.
 * Nếu đã là string thì trả về nguyên bản.
 */
export function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

/**
 * Chuyển string date từ backend → dayjs object cho DatePicker.
 * Trả undefined nếu giá trị không hợp lệ.
 */
export function toDatePickerValue(value) {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

/**
 * Chuyển đổi các date fields trong values sang string YYYY-MM-DD.
 * @param {object} values - Form values
 * @param {string[]} dateFields - Danh sách tên field cần convert
 */
export function convertDateFields(values, dateFields) {
  const result = { ...values };

  for (const field of dateFields) {
    if (result[field] !== undefined) {
      result[field] = toDateString(result[field]);
    }
  }

  return result;
}

function normalizeNumericInput(value, allowDecimal = true) {
  const raw = String(value ?? '').replace(/,/g, '');
  
  const isNegative = raw.startsWith('-');
  const sanitized = raw.replace(/[^\d.]/g, '');

  let result = sanitized;
  if (!allowDecimal) {
    result = sanitized.replace(/\./g, '');
  } else {
    const firstDotIndex = sanitized.indexOf('.');
    if (firstDotIndex !== -1) {
      const integerPart = sanitized.slice(0, firstDotIndex);
      const decimalPart = sanitized.slice(firstDotIndex + 1).replace(/\./g, '');
      result = `${integerPart}.${decimalPart}`;
    }
  }

  if (isNegative) {
    return result ? `-${result}` : '-';
  }
  return result;
}


export const decimalInputProps = {
  inputMode: 'decimal',
  parser: (value) => normalizeNumericInput(value, true),
  formatter: (value, info) => {
    if (value === undefined || value === null || value === '') return '';
    const str = String(value);
    if (info && info.userTyping) {
      return formatNumberExcel(str, true);
    }
    const num = Number(str.replace(/,/g, ''));
    if (isNaN(num)) return str;
    return formatNumberExcel(num.toString());
  },
  onKeyPress: (event) => {
    if (event.key.length === 1 && !/[\d.-]/.test(event.key)) {
      event.preventDefault();
    }
  }
};

export const integerInputProps = {
  inputMode: 'numeric',
  parser: (value) => normalizeNumericInput(value, false),
  formatter: (value, info) => {
    if (value === undefined || value === null || value === '') return '';
    const str = String(value);
    if (info && info.userTyping) {
      return formatNumberExcel(str, true);
    }
    const num = parseInt(str.replace(/,/g, ''), 10);
    if (isNaN(num)) return str;
    return formatNumberExcel(num.toString());
  },
  onKeyPress: (event) => {
    if (event.key.length === 1 && !/[\d-]/.test(event.key)) {
      event.preventDefault();
    }
  }
};
