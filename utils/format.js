export function formatNumberExcel(value, isTyping = false) {
  if (value === undefined || value === null || value === '') return '';
  let str = String(value).replace(/,/g, '');

  if (!isTyping) {
    const num = Number(str);
    if (!Number.isNaN(num)) {
      str = num.toString();
    }
  }

  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return '0';
  const num = Number(value);
  if (Number.isNaN(num)) return '0';
  // Round to integer for display (VND does not use decimals)
  const rounded = Math.round(num);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function sumAmounts(items = []) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

export function formatDate(value, language = 'vi') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return language === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function formatDateTime(value, language = 'vi') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const dateStr = language === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  return `${dateStr} ${hours}:${minutes}`;
}
