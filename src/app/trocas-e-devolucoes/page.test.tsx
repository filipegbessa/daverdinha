import { render, screen, within } from '@testing-library/react';
import TrocasEDevolucoesPage, { generateMetadata } from './page';

describe('TrocasEDevolucoesPage', () => {
  it('states the legal deadlines: 7 days to give up, 30 and 90 days for defects', async () => {
    render(await TrocasEDevolucoesPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Trocas e devoluções' })).toBeInTheDocument();
    expect(screen.getByText(/7 dias/, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/até 30 dias/)).toBeInTheDocument();
    expect(screen.getByText(/até 90 dias/)).toBeInTheDocument();
  });

  it('says how to ask, by WhatsApp or email, with the order code', async () => {
    render(await TrocasEDevolucoesPage());
    const main = within(screen.getByRole('main'));

    expect(main.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
    expect(main.getByRole('link', { name: 'contato@daverdinha.com.br' })).toHaveAttribute(
      'href',
      'mailto:contato@daverdinha.com.br',
    );
    expect(main.getByRole('link', { name: 'Meus pedidos' })).toHaveAttribute('href', '/meus-pedidos');
  });

  it('is the page the checkout links to, with its own canonical', async () => {
    const metadata = await generateMetadata();
    expect(metadata.alternates).toEqual({ canonical: '/trocas-e-devolucoes' });
  });
});
