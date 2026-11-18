import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/features/site/types/catalog';

const product: Product = {
  id: '1',
  name: 'Vaso Terracota M',
  slug: 'vaso-terracota-m',
  description: 'Vaso de terracota de 18 cm.',
  price: 89.9,
  images: ['https://example.com/vaso.jpg'],
  category: { id: 'c1', name: 'Vasos', slug: 'vasos' },
  availability: 'in_stock',
  leadTimeDays: null,
};

describe('ProductCard', () => {
  it('shows the discount once, as a badge over the photo, when on sale', () => {
    render(<ProductCard product={{ ...product, price: 74.9, listPrice: 89.9 }} />);

    expect(screen.getByText('-17%')).toBeInTheDocument();
    expect(screen.getAllByText(/-17%/)).toHaveLength(1);
    expect(screen.getByText('-17%').closest('span')).toHaveClass('absolute');
  });

  it('has no badge without a sale', () => {
    render(<ProductCard product={product} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('links to the product and shows name, price and availability (full, default)', () => {
    render(<ProductCard product={product} />);
    const link = screen.getByRole('link', { name: /Vaso Terracota M/ });
    expect(link).toHaveAttribute('href', '/produtos/vasos/vaso-terracota-m');
    expect(screen.getByText('R$ 89,90')).toBeInTheDocument();
    expect(screen.getByText('Pronta entrega')).toBeInTheDocument();
  });

  it('renders a smaller card with a tiny photo in the compact variant', () => {
    render(<ProductCard product={product} variant="compact" />);
    expect(screen.getByAltText('Vaso Terracota M')).toHaveAttribute('src', expect.stringContaining('vaso.jpg'));
    expect(screen.getByText('R$ 89,90')).toBeInTheDocument();
  });

  it('falls back to a placeholder when the product has no photo', () => {
    render(<ProductCard product={{ ...product, images: [] }} variant="compact" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
