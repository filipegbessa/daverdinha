import { clampQuantity, isFreeEvent, ticketCheckoutHref, ticketLimit } from './tickets';

describe('ticket helpers', () => {
  it('treats no price and zero as free', () => {
    expect(isFreeEvent({ price: null })).toBe(true);
    expect(isFreeEvent({ price: 0 })).toBe(true);
    expect(isFreeEvent({ price: 45 })).toBe(false);
  });

  it('limits by the per-order cap or the spots left, whichever is lower', () => {
    expect(ticketLimit({ maxTicketsPerOrder: 4, spotsLeft: null })).toBe(4);
    expect(ticketLimit({ maxTicketsPerOrder: 4, spotsLeft: 2 })).toBe(2);
    expect(ticketLimit({ maxTicketsPerOrder: 4, spotsLeft: 0 })).toBe(0);
  });

  it('keeps the quantity between 1 and the limit, whatever comes in the URL', () => {
    expect(clampQuantity('2', 4)).toBe(2);
    expect(clampQuantity('9', 4)).toBe(4);
    expect(clampQuantity('0', 4)).toBe(1);
    expect(clampQuantity('abc', 4)).toBe(1);
    expect(clampQuantity(undefined, 4)).toBe(1);
  });

  it('links to the ticket checkout of the event with the quantity', () => {
    expect(ticketCheckoutHref({ slug: 'oficina' }, 3)).toBe('/agenda/oficina/ingressos?quantidade=3');
  });
});
