import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import Page from './page';

const renderPage = async (page?: string, params: Record<string, string> = {}) =>
  render(await Page({ searchParams: Promise.resolve({ page, ...params }) }));

describe('/produtos', () => {
  beforeEach(() => {
    mockSiteSettings({ siteEnabled: false });
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('lists the products', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Loja');
    expect(screen.getByRole('link', { name: /Vaso Terracota M/ })).toBeInTheDocument();
  });

  it('has no pagination controls when everything fits on one page', async () => {
    await renderPage();

    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('shows upcoming events and the studio address', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Próximos eventos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Onde estamos' })).toBeInTheDocument();
  });

  it('sorts and filters from the URL', async () => {
    await renderPage(undefined, { tipo: 'made_to_order', ordem: 'price_asc' });

    const cards = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(cards[0]).toBe('Kit Kokedama');
    expect(cards).not.toContain('Vaso Terracota M');
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price_asc');
  });
});
