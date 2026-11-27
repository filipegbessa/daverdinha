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

  it('states the store rules on top of the law', async () => {
    render(await TrocasEDevolucoesPage());

    expect(screen.getAllByText('48 horas', { selector: 'strong' })).toHaveLength(2);
    expect(screen.getByText(/Trocamos por outra planta igual ou de mesmo valor/)).toBeInTheDocument();
    expect(screen.getByText(/Depois de 7 dias da entrega, o cuidado/)).toBeInTheDocument();
    expect(screen.getByText(/a troca é\s+feita só no ateliê/)).toBeInTheDocument();
    expect(screen.getByText(/cancelar antes ou durante a confecção, com todo o dinheiro de volta/)).toBeInTheDocument();
    expect(screen.getByText('3 dias úteis', { selector: 'strong' })).toBeInTheDocument();
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
