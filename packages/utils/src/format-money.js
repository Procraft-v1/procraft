export function formatMoneyUZS(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '';
  try {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return String(amount);
  }
}
