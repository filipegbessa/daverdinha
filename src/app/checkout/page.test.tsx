import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import CheckoutPage, { metadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('/checkout', () => {
  it('is a 404 while the store is off', async () => {
    mockSiteSettings({ storeEnabled: false });

    await expect(CheckoutPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('shows the checkout with the store on, and is never indexed', async () => {
    mockSiteSettings({ storeEnabled: true });

    render(await CheckoutPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
