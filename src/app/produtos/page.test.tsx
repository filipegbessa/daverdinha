import { render, screen } from '@testing-library/react';
import Page from './page';

const renderPage = async (page?: string) => render(await Page({ searchParams: Promise.resolve({ page }) }));

describe('/produtos', () => {
  beforeEach(() => {
    delete process.env.SITE_MODE;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('lists the products', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Produtos');
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
});
