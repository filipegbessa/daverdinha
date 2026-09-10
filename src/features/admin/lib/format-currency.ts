export function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value).replace(/ /g, ' ');
}
