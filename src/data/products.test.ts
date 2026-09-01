import { PRODUCT_CATEGORIES } from './products';

describe('PRODUCT_CATEGORIES', () => {
  it('starts empty until the client confirms categories (see PERGUNTAS-CLIENTE-SITE.md)', () => {
    expect(PRODUCT_CATEGORIES).toEqual([]);
  });
});
