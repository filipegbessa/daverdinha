import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen, within } from '@testing-library/react';
import OrderNotFoundPage from './not-found';

describe('/pedido/[token] not found', () => {
  beforeEach(() => mockSiteSettings({ storeEnabled: true }));
  afterAll(() => mockSiteSettings({ storeEnabled: false }));

  it('explains the link may be wrong and offers to send the links again', async () => {
    render(await OrderNotFoundPage());

    const main = within(screen.getByRole('main'));
    expect(main.getByRole('heading', { name: 'Pedido não encontrado' })).toBeInTheDocument();
    expect(main.getByRole('link', { name: 'Receber os links por e-mail' })).toHaveAttribute('href', '/meus-pedidos');
    expect(main.getByRole('link', { name: /Falar no WhatsApp/ })).toBeInTheDocument();
  });
});
