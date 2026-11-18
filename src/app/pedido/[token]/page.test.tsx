import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import OrderPage, { dynamic, metadata } from './page';
import { getOrderByToken } from '@/features/store/lib/store-api';
import { previewOrder } from '@/features/store/test-fixtures/order';
import { getActiveProductBySlug } from '@/features/site/lib/public-api';
import { SAMPLE_PRODUCTS } from '@/features/site/test-fixtures/catalog';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock('@/features/store/lib/store-api', () => ({ getOrderByToken: jest.fn() }));
jest.mock('@/features/site/lib/public-api', () => ({
  ...jest.requireActual('@/features/site/lib/public-api'),
  getActiveProductBySlug: jest.fn(),
}));

const renderPage = async (token: string) => render(await OrderPage({ params: Promise.resolve({ token }) }));

describe('/pedido/[token]', () => {
  beforeEach(() => {
    mockSiteSettings({ storeEnabled: true });
    mockSiteSettings({ siteEnabled: false });
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockSiteSettings({ storeEnabled: false });
  });

  it('is never cached nor indexed', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('is a 404 with the store off or for an unknown token', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue(null);
    await expect(renderPage('nope')).rejects.toThrow('NEXT_NOT_FOUND');

    mockSiteSettings({ storeEnabled: false });
    await expect(renderPage('abc')).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('says the page could not load, instead of a 404, when the API fails', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue('unavailable');
    await renderPage('abc');

    expect(screen.getByRole('heading', { name: 'Não conseguimos abrir seu pedido agora' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tentar de novo' })).toHaveAttribute('href', '/pedido/abc');
  });

  it('shows a ticket order even with the products store off', async () => {
    mockSiteSettings({ storeEnabled: false });
    (getOrderByToken as jest.Mock).mockResolvedValue({
      ...previewOrder('paid'),
      code: 'DV-0043',
      kind: 'tickets',
      items: [],
      event: {
        title: 'Oficina de terrário',
        slug: 'oficina-de-terrario',
        startsAt: '2026-11-21T13:00:00.000Z',
        endsAt: '2026-11-21T15:00:00.000Z',
        locationName: null,
        locationAddress: null,
      },
      tickets: [{ attendeeName: 'Ana Lima', unitPrice: 45, code: 'K7Q2M9XP', checkedIn: false }],
      deliveryMethod: null,
      pickup: null,
    });

    await renderPage('abc');

    expect(screen.getByRole('heading', { name: 'Ingresso confirmado!' })).toBeInTheDocument();
  });

  it('keeps a products order a 404 with the store off', async () => {
    mockSiteSettings({ storeEnabled: false });
    (getOrderByToken as jest.Mock).mockResolvedValue(previewOrder('paid'));

    await expect(renderPage('abc')).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('shows the order read from the API by its token', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue({ ...previewOrder('paid'), code: 'DV-0042' });

    await renderPage('abc');

    expect(getOrderByToken).toHaveBeenCalledWith('abc');
    expect(screen.getByText('Pedido DV-0042')).toBeInTheDocument();
  });

  it('offers to buy the items again, leaving out what is no longer for sale', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue(previewOrder('paid'));
    (getActiveProductBySlug as jest.Mock).mockImplementation(async (slug: string) =>
      slug === SAMPLE_PRODUCTS[0].slug ? { ...SAMPLE_PRODUCTS[0], availability: 'in_stock' } : null,
    );

    await renderPage('abc');

    expect(screen.getByRole('button', { name: 'Comprar de novo' })).toBeInTheDocument();
    expect(screen.getByText('1 item deste pedido não está mais disponível e fica de fora.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Andamento do pedido' })).toBeInTheDocument();
  });

  it('points an expired order back to the products when nothing is for sale anymore', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue(previewOrder('expired'));
    (getActiveProductBySlug as jest.Mock).mockResolvedValue(null);

    await renderPage('abc');

    expect(screen.queryByRole('button', { name: 'Colocar os mesmos itens no carrinho' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toBeInTheDocument();
  });

  it('has no sample order: "exemplo" is just an unknown token', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue(null);

    await expect(renderPage('exemplo')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
