export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function sumAmounts(items = []) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}
