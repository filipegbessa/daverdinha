import { DEFAULT_FAQ_CONTEXT, faqItems, type FaqContext } from './faq';

const questions = (ctx?: FaqContext) => faqItems(ctx).map((item) => item.question);

const storeOn: FaqContext = {
  storeEnabled: true,
  ticketsEnabled: true,
  maxInstallments: 3,
  minInstallmentValue: 50,
  pickup: { address: 'Rua do Ateliê, 10 - Santo Cristo', hours: 'de terça a sábado, das 10h às 17h' },
};

describe('faqItems', () => {
  it('sticks to WhatsApp and the general questions while the store is off', () => {
    expect(questions(DEFAULT_FAQ_CONTEXT)).toEqual([
      'Como faço um pedido?',
      'O que é "sob encomenda" e quanto tempo demora?',
      'Para quais regiões vocês entregam?',
      'Como cuido da minha planta?',
    ]);
    expect(faqItems()[0].answer).toContain('WhatsApp');
  });

  it('adds payment, pickup, tracking, returns, coupons and tickets with the store on', () => {
    expect(questions(storeOn)).toHaveLength(11);
  });

  it('answers with what is set up in the admin', () => {
    const items = faqItems(storeOn);
    const answer = (q: string) => items.find((item) => item.question === q)?.answer ?? '';

    expect(answer('Quais formas de pagamento vocês aceitam?')).toContain('em até 3x sem juros');
    expect(answer('Quais formas de pagamento vocês aceitam?')).toMatch(/parcela mínima de R\$\s50,00/);
    expect(answer('Posso retirar no ateliê?')).toContain('Rua do Ateliê, 10 - Santo Cristo');
  });

  it('leaves pickup and tickets out when they are off', () => {
    const list = questions({ ...storeOn, pickup: null, ticketsEnabled: false });

    expect(list).not.toContain('Posso retirar no ateliê?');
    expect(list.some((q) => q.includes('ingresso'))).toBe(false);
  });

  it('points at the live section instead of naming zones that can go stale', () => {
    const answer = faqItems().find((item) => item.question === 'Para quais regiões vocês entregam?')?.answer ?? '';
    expect(answer).toContain('Onde entregamos');
    expect(answer).not.toContain('Zona Portuária');
  });
});
