import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import CartPage, { metadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

describe('/carrinho', () => {
  const original = process.env.NEXT_PUBLIC_STORE_ENABLED;
  afterEach(() => {
    process.env.NEXT_PUBLIC_STORE_ENABLED = original;
  });

  it('is a 404 while the store is off', () => {
    delete process.env.NEXT_PUBLIC_STORE_ENABLED;

    expect(() => CartPage()).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('shows the cart with the store on, and is never indexed', () => {
    process.env.NEXT_PUBLIC_STORE_ENABLED = 'true';

    render(CartPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Carrinho' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
