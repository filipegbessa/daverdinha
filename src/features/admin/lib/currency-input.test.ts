import { centsFromInput, MAX_CENTS } from './currency-input';

describe('centsFromInput', () => {
  it('reads the typed digits as cents, ignoring the mask', () => {
    expect(centsFromInput('R$ 59,905')).toBe(59_905);
    expect(centsFromInput('R$ 0,00')).toBe(0);
    expect(centsFromInput('')).toBe(0);
  });

  it('caps the value', () => {
    expect(centsFromInput('9'.repeat(12))).toBe(MAX_CENTS);
  });
});
