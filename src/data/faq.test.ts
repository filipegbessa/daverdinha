import { FAQ_ITEMS } from './faq';

describe('FAQ_ITEMS', () => {
  it('includes the 2 confirmed FAQs, grounded in the bot flow and delivery zones from SPEC.md', () => {
    expect(FAQ_ITEMS.map((item) => item.question)).toEqual([
      'Como faço um pedido?',
      'Para quais regiões vocês entregam?',
    ]);
  });
});
