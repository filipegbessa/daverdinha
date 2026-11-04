import { eventCalendar, formatEventPrice, formatEventShort, formatEventWhen, formatPrice } from './format';

describe('formatPrice', () => {
  it('formats in BRL with a plain space', () => {
    expect(formatPrice(89.9)).toBe('R$ 89,90');
    expect(formatPrice(1290)).toBe('R$ 1.290,00');
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

  it('has a short version for the top bar', () => {
    expect(formatEventShort(startsAt)).toBe('sáb 14/11 · 10h');
  });

  it('calls a free event free', () => {
    expect(formatEventPrice(null)).toBe('Gratuito');
    expect(formatEventPrice(120)).toBe('R$ 120,00');
  });
});
