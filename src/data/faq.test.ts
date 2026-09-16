import { FAQ_ITEMS } from './faq';

describe('FAQ_ITEMS', () => {
  it('includes the 2 confirmed FAQs, grounded in the bot flow and delivery zones from SPEC.md', () => {
    expect(FAQ_ITEMS.map((item) => item.question)).toEqual([
      'Como faço um pedido?',
      'Para quais regiões vocês entregam?',
    ]);
  });

  it('points at the live section instead of naming zones that can go stale', () => {
    const answer = FAQ_ITEMS.find((item) => item.question === 'Para quais regiões vocês entregam?')?.answer ?? '';
    expect(answer).toContain('Onde entregamos');
    expect(answer).not.toContain('Zona Portuária');
  });
});
