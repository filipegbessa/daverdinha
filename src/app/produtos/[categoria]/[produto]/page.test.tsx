import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
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

// Sem NEXT_PUBLIC_API_URL e com o site desligado, a página usa os produtos de exemplo.
describe('/produtos/[categoria]/[produto]', () => {
  beforeEach(() => {
    mockSiteSettings({ siteEnabled: false });
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

  it('shows other best-sellers (featured) from the same category, not itself', async () => {
    await renderPage('vasos', 'vaso-terracota-m');

    const section = screen.getByRole('heading', { name: 'Mais vendidos em vasos' }).closest('section')!;
    expect(section).toHaveTextContent('Vaso Pintado Folhagem');
    expect(section).not.toHaveTextContent('Vaso Terracota M');
  });

  it('has no events section on the product page', async () => {
    await renderPage('vasos', 'vaso-terracota-m');

    expect(screen.queryByRole('heading', { name: 'Próximos eventos' })).not.toBeInTheDocument();
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

  describe('with the store on', () => {
    beforeEach(() => {
      mockSiteSettings({ storeEnabled: true });
    });
    afterEach(() => {
      mockSiteSettings({ storeEnabled: false });
    });

    it('sells through the cart only, without the WhatsApp order button', async () => {
      await renderPage('vasos', 'vaso-terracota-m');

      // Exemplo da prévia: entra no carrinho pra validar a loja, com o aviso.
      expect(screen.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled();
      expect(screen.getByText(/Prévia: produto de exemplo/)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Pedir pelo WhatsApp' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Carrinho' })).toHaveAttribute('href', '/carrinho');
    });
  });

  it('has no cart without the store', async () => {
    await renderPage('vasos', 'vaso-terracota-m');

    expect(screen.queryByRole('link', { name: 'Carrinho' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /carrinho|lançamento/i })).not.toBeInTheDocument();
  });
});
