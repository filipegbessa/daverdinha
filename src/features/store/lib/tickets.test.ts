import {
  clampQuantity,
  isFreeEvent,
  quantityLimitText,
  spotsLeftText,
  ticketCheckoutHref,
  ticketLimit,
} from './tickets';

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

  it('says how many spots are left, or nothing when there is no limit', () => {
    expect(spotsLeftText(5)).toBe('Restam 5 vagas');
    expect(spotsLeftText(1)).toBe('Resta 1 vaga');
    expect(spotsLeftText(null)).toBeNull();
  });

  it('explains the limit only once the quantity reaches it', () => {
    const paid = { maxTicketsPerOrder: 4, spotsLeft: 10, price: 45 };
    expect(quantityLimitText(paid, 3)).toBeNull();
    expect(quantityLimitText(paid, 4)).toBe('O máximo por compra é 4 ingressos.');
    expect(quantityLimitText({ ...paid, price: null }, 4)).toBe('O máximo por inscrição é 4 pessoas.');
    expect(quantityLimitText({ ...paid, spotsLeft: 2 }, 2)).toBe('Só restam 2 vagas.');
    expect(quantityLimitText({ ...paid, spotsLeft: null }, 4)).toBe('O máximo por compra é 4 ingressos.');
    // Uma vaga só: não tem seletor, não tem aviso.
    expect(quantityLimitText({ ...paid, spotsLeft: 1 }, 1)).toBeNull();
  });

  it('links to the ticket checkout of the event with the quantity', () => {
    expect(ticketCheckoutHref({ slug: 'oficina' }, 3)).toBe('/agenda/oficina/ingressos?quantidade=3');
  });
});
