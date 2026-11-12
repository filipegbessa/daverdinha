import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import CartPage, { metadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

describe('/carrinho', () => {
  it('is a 404 while the store is off', async () => {
    mockSiteSettings({ storeEnabled: false });

    await expect(CartPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('shows the cart with the store on, and is never indexed', async () => {
    mockSiteSettings({ storeEnabled: true });

    render(await CartPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Carrinho' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
