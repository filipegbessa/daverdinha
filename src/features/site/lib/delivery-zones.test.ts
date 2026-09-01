import { DELIVERY_ZONES } from './delivery-zones';

describe('DELIVERY_ZONES', () => {
  it('lists exactly the 4 covered zones from SPEC.md, in order', () => {
    expect(DELIVERY_ZONES.map((z) => z.zona)).toEqual(['Zona Sul', 'Centro', 'Zona Portuária', 'Zona Norte']);
  });

  it('Zona Sul includes the real neighborhoods from SPEC.md', () => {
    const zonaSul = DELIVERY_ZONES.find((z) => z.zona === 'Zona Sul');
    expect(zonaSul?.bairros).toEqual([
      'Botafogo', 'Catete', 'Copacabana', 'Cosme Velho', 'Flamengo', 'Gávea',
      'Humaitá', 'Ipanema', 'Jardim Botânico', 'Lagoa', 'Laranjeiras', 'Leblon', 'São Conrado',
    ]);
  });
});
