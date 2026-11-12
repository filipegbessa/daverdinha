import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import OrderPage, { dynamic, metadata } from './page';
import { getOrderByToken } from '@/features/store/lib/store-api';
import { previewOrder } from '@/features/store/lib/preview-order';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('@/features/store/lib/store-api', () => ({ getOrderByToken: jest.fn() }));

const renderPage = async (token: string, query: Record<string, string> = {}) =>
  render(await OrderPage({ params: Promise.resolve({ token }), searchParams: Promise.resolve(query) }));

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

  it('shows the order read from the API by its token', async () => {
    (getOrderByToken as jest.Mock).mockResolvedValue({ ...previewOrder('paid'), code: 'DV-0042' });

    await renderPage('abc');

    expect(getOrderByToken).toHaveBeenCalledWith('abc');
    expect(screen.getByText('Pedido DV-0042')).toBeInTheDocument();
  });

  it('shows a sample order in each state before the launch, without calling the API', async () => {
    await renderPage('exemplo', { status: 'expired' });

    expect(screen.getByRole('heading', { name: 'O prazo de pagamento acabou' })).toBeInTheDocument();
    expect(screen.getByText(/Prévia do site/)).toBeInTheDocument();
    expect(getOrderByToken).not.toHaveBeenCalled();
  });

  it('has no sample order after the launch', async () => {
    mockSiteSettings({ siteEnabled: true });
    (getOrderByToken as jest.Mock).mockResolvedValue(null);

    await expect(renderPage('exemplo')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
