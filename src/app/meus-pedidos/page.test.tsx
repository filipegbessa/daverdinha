import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import Page, { metadata } from './page';

describe('/meus-pedidos', () => {
  it('asks for the email even with the products store off, and is never indexed', async () => {
    mockSiteSettings({ siteEnabled: true, storeEnabled: false });

    render(await Page());

    expect(screen.getByRole('heading', { level: 1, name: 'Meus pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Receber meus pedidos' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
