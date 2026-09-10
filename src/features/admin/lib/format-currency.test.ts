import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats a BRL amount given as a string', () => {
    expect(formatCurrency('35.00', 'BRL')).toBe('R$ 35,00');
  });

  it('formats a BRL amount given as a number', () => {
    expect(formatCurrency(200, 'BRL')).toBe('R$ 200,00');
  });

  it('falls back to "currency amount" when the amount cannot be parsed', () => {
    expect(formatCurrency('not-a-number', 'BRL')).toBe('BRL not-a-number');
  });
});
