/**
 * Shared form utility functions — dùng chung cho tất cả pages có form.
 *
 * Import:
 *   import { cleanPayload, toDateString, toDatePickerValue } from '@/utils/formUtils';
 */
import dayjs from 'dayjs';

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
