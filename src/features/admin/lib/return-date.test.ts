import { formatReturnDate, isoToReturnDate, returnDateToIso } from './return-date';

describe('return-date', () => {
  it('turns the day into midnight in Rio, and back', () => {
    expect(returnDateToIso('2027-01-06')).toBe('2027-01-06T03:00:00.000Z');
    expect(isoToReturnDate('2027-01-06T03:00:00.000Z')).toBe('2027-01-06');
  });

  it('treats empty as no date', () => {
    expect(returnDateToIso('')).toBeNull();
    expect(isoToReturnDate(null)).toBe('');
  });

  it('formats the day in Rio', () => {
    expect(formatReturnDate('2027-01-06T03:00:00.000Z')).toMatch(/^6 de jan/);
  });
});
