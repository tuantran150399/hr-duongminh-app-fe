export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function sumAmounts(items = []) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}
