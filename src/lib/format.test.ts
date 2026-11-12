import {
  eventCalendar,
  eventEndTime,
  formatCurrency,
  formatDateTime,
  formatEventPrice,
  formatEventShort,
  formatEventWhen,
  formatPrice,
} from './format';

describe('formatPrice', () => {
  it('formats in BRL with a plain space', () => {
    expect(formatPrice(89.9)).toBe('R$ 89,90');
    expect(formatPrice(1290)).toBe('R$ 1.290,00');
  });
});

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

describe('formatDateTime', () => {
  // 23h40 UTC do dia 9 ainda é dia 9 no Rio (20h40), e meia-noite e meia UTC
  // do dia 10 também (21h30 do dia 9).
  it('shows date and time in Rio time, whatever the runtime timezone', () => {
    expect(formatDateTime('2026-11-10T00:30:00.000Z')).toBe('09/11/2026 21:30');
  });

  it('can leave the year out', () => {
    expect(formatDateTime('2026-11-09T23:40:00.000Z', { withYear: false })).toBe('09/11 20:40');
  });
});

describe('event dates', () => {
  // 10h no Rio = 13h UTC. Se o fuso não for aplicado, isto sai "13h".
  const startsAt = '2026-11-14T13:00:00.000Z';
  const endsAt = '2026-11-14T15:30:00.000Z';

  it('reads the calendar in Rio time', () => {
    expect(eventCalendar(startsAt)).toEqual({ day: '14', month: 'nov', weekday: 'sáb' });
  });

  it('describes when it happens, in Rio time', () => {
    expect(formatEventWhen(startsAt, endsAt)).toBe('sáb, 14/11 · 10h às 12h30');
  });

  it('shows only the start when there is no end time', () => {
    expect(formatEventWhen(startsAt, null)).toBe('sáb, 14/11 · 10h');
  });

  it('ends an event without an end time at the end of its day in Rio', () => {
    expect(eventEndTime({ startsAt, endsAt })).toBe(new Date(endsAt).getTime());
    expect(new Date(eventEndTime({ startsAt, endsAt: null })).toISOString()).toBe('2026-11-15T02:59:59.999Z');
  });

  it('has a short version for the top bar', () => {
    expect(formatEventShort(startsAt)).toBe('sáb 14/11 · 10h');
  });

  it('calls a free event free', () => {
    expect(formatEventPrice(null)).toBe('Gratuito');
    expect(formatEventPrice(120)).toBe('R$ 120,00');
  });
});
