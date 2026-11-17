import { render } from '@testing-library/react';
import { ViewItemTracker } from './ViewItemTracker';
import type { Product } from '@/features/site/types/catalog';

const product = {
  id: 'p1',
  name: 'Vaso M',
  price: 89.9,
  category: { name: 'Vasos', slug: 'vasos' },
} as Product;

describe('ViewItemTracker', () => {
  afterEach(() => {
    delete window.gtag;
  });

  it('sends view_item once with the product', () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    const { rerender } = render(<ViewItemTracker product={product} />);
    rerender(<ViewItemTracker product={product} />);

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'view_item', {
      currency: 'BRL',
      value: 89.9,
      items: [{ item_id: 'p1', item_name: 'Vaso M', item_category: 'Vasos', price: 89.9 }],
    });
  });

  it('does nothing without analytics', () => {
    expect(() => render(<ViewItemTracker product={product} />)).not.toThrow();
  });
});
