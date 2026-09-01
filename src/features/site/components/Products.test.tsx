import { render, screen } from '@testing-library/react';
import { Products } from './Products';
import { PRODUCT_CATEGORIES } from '@/data/products';

describe('Products', () => {
  afterEach(() => {
    PRODUCT_CATEGORIES.length = 0;
  });

  it('renders nothing when there are no categories', () => {
    const { container } = render(<Products />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each category once populated', () => {
    PRODUCT_CATEGORIES.push({ name: 'Vasos', description: 'Vasos de diversos tamanhos e estilos.' });
    render(<Products />);
    expect(screen.getByText('Vasos')).toBeInTheDocument();
    expect(screen.getByText('Vasos de diversos tamanhos e estilos.')).toBeInTheDocument();
  });
});
