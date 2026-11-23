import { isOnSale } from './sale';
import { SAMPLE_PRODUCTS } from '@/features/site/test-fixtures/catalog';

const product = SAMPLE_PRODUCTS[0];

describe('isOnSale', () => {
  it('is on sale only with a list price above the current price', () => {
    expect(isOnSale({ ...product, price: 99, listPrice: 119 })).toBe(true);
    expect(isOnSale({ ...product, price: 99, listPrice: null })).toBe(false);
    expect(isOnSale({ ...product, price: 99, listPrice: undefined })).toBe(false);
    expect(isOnSale({ ...product, price: 99, listPrice: 99 })).toBe(false);
  });
});
