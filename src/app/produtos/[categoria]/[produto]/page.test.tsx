import { render, screen } from '@testing-library/react';
import { notFound, permanentRedirect } from 'next/navigation';
import Page from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  permanentRedirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

jest.mock('@/features/site/lib/delivery-zones', () => ({
  getCoveredDeliveryZones: jest.fn().mockResolvedValue([]),
}));

const renderPage = async (categoria: string, produto: string) =>
  render(await Page({ params: Promise.resolve({ categoria, produto }) }));

// Sem NEXT_PUBLIC_API_URL e sem SITE_MODE, a página usa os produtos de exemplo.
describe('/produtos/[categoria]/[produto]', () => {
  beforeEach(() => {
    delete process.env.SITE_MODE;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('shows the product with its price and a WhatsApp order naming it', async () => {
    await renderPage('vasos', 'vaso-terracota-m');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vaso Terracota M');
    expect(screen.getAllByText('R$ 89,90').length).toBeGreaterThan(0);
    const order = screen.getByRole('link', { name: 'Pedir pelo WhatsApp' });
    expect(decodeURIComponent(order.getAttribute('href')!)).toContain('*Vaso Terracota M* (R$ 89,90)');
  });

  it('links the breadcrumb back through the category', async () => {
    await renderPage('vasos', 'vaso-terracota-m');

    const trail = screen.getByRole('navigation', { name: 'Você está em' });
    expect(trail).toHaveTextContent('Início');
    expect(screen.getAllByRole('link', { name: 'Vasos' })[0]).toHaveAttribute('href', '/produtos/vasos');
  });

  it('emits Product structured data', async () => {
    const { container } = await renderPage('vasos', 'vaso-terracota-m');

    const types = [...container.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => JSON.parse(s.innerHTML)['@type'],
    );
    expect(types).toEqual(expect.arrayContaining(['Product', 'BreadcrumbList']));
  });

  // O produto mudou de categoria: a URL antiga não pode virar 404.
  it('redirects permanently when the category in the URL is not the product’s', async () => {
    await expect(renderPage('mudas', 'vaso-terracota-m')).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith('/produtos/vasos/vaso-terracota-m');
  });

  it('is a 404 for a product that does not exist', async () => {
    await expect(renderPage('vasos', 'nao-existe')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
