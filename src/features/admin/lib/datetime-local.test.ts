import { fromDatetimeLocal, toDatetimeLocal } from './datetime-local';

describe('datetime-local', () => {
  it('shows a UTC date in Rio time', () => {
    expect(toDatetimeLocal('2026-11-21T13:00:00.000Z')).toBe('2026-11-21T10:00');
    expect(toDatetimeLocal('2026-11-22T01:30:00.000Z')).toBe('2026-11-21T22:30');
  });

  it('reads Rio time back as UTC', () => {
    expect(fromDatetimeLocal('2026-11-21T10:00')).toBe('2026-11-21T13:00:00.000Z');
    expect(fromDatetimeLocal('2026-11-21T22:30')).toBe('2026-11-22T01:30:00.000Z');
  });

  it('is null when empty or invalid', () => {
    expect(fromDatetimeLocal('')).toBeNull();
    expect(fromDatetimeLocal('amanhã')).toBeNull();
  });
});
