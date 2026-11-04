import { fireEvent, render, screen, within } from '@testing-library/react';
import { ProductsSection } from './ProductsSection';
import { SAMPLE_FEATURED_PRODUCTS } from '@/features/site/data/samples';

describe('ProductsSection (home showcase)', () => {
  it('renders nothing without featured products', () => {
    const { container } = render(<ProductsSection products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a tag only for categories that have a featured product', () => {
    render(<ProductsSection products={SAMPLE_FEATURED_PRODUCTS} />);

    const tags = within(screen.getByRole('group', { name: 'Filtrar por categoria' }))
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(tags).toEqual(['Todos', 'Vasos', 'Mudas', 'Arranjos', 'Kits']);
  });

  it('filters in place when a tag is clicked, without leaving the page', () => {
    render(<ProductsSection products={SAMPLE_FEATURED_PRODUCTS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Vasos' }));

    const showcase = screen.getByRole('region', { name: 'Produtos em destaque' });
    const names = within(showcase).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(['Vaso Terracota M', 'Vaso Pintado Folhagem']);
    expect(screen.getByRole('button', { name: 'Vasos' })).toHaveAttribute('aria-pressed', 'true');
  });

  // As tags são botões; é este link que mantém as páginas de categoria
  // alcançáveis a partir da home pro Google.
  it('points "see all" at the selected category page', () => {
    render(<ProductsSection products={SAMPLE_FEATURED_PRODUCTS} />);
    expect(screen.getByRole('link', { name: 'Ver todos os produtos' })).toHaveAttribute('href', '/produtos');

    fireEvent.click(screen.getByRole('button', { name: 'Mudas' }));
    expect(screen.getByRole('link', { name: 'Ver todos de Mudas' })).toHaveAttribute('href', '/produtos/mudas');
  });
});
