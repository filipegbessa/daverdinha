import { render, screen } from '@testing-library/react';
import { ProductPrice, discountPercent } from './ProductPrice';

describe('ProductPrice', () => {
  it('shows only the price without a promo', () => {
    render(<ProductPrice product={{ price: 89.9, listPrice: null }} />);
    expect(screen.getByText('R$ 89,90')).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('shows the crossed-out full price, the promo price and the discount', () => {
    const { container } = render(<ProductPrice product={{ price: 99, listPrice: 119 }} size="lg" />);

    expect(container.querySelector('s')).toHaveTextContent('De R$ 119,00');
    expect(container.firstChild).toHaveTextContent('De R$ 119,00por R$ 99,00-17%');
  });

  it('rounds the discount', () => {
    expect(discountPercent(64, 80)).toBe(20);
    expect(discountPercent(99, 119)).toBe(17);
  });
});
