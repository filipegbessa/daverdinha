import { render, screen } from '@testing-library/react';
import CheckoutPage, { metadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('/checkout', () => {
  const original = process.env.NEXT_PUBLIC_STORE_ENABLED;
  afterEach(() => {
    process.env.NEXT_PUBLIC_STORE_ENABLED = original;
  });

  it('is a 404 while the store is off', () => {
    delete process.env.NEXT_PUBLIC_STORE_ENABLED;

    expect(() => CheckoutPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('shows the checkout with the store on, and is never indexed', () => {
    process.env.NEXT_PUBLIC_STORE_ENABLED = 'true';

    render(CheckoutPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
