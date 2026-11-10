import { render, screen, within } from '@testing-library/react';
import PoliticaDePrivacidadePage, { metadata } from './page';

describe('PoliticaDePrivacidadePage', () => {
  it('explains both data sources: site analytics and WhatsApp conversations', () => {
    render(<PoliticaDePrivacidadePage />);
    expect(screen.getByText(/Google Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Conversas pelo WhatsApp:/)).toBeInTheDocument();
  });

  it('states LGPD rights and shows real contact info', () => {
    render(<PoliticaDePrivacidadePage />);
    expect(screen.getByText(/Lei Geral de Proteção de Dados/)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText(/R\. Capiberibe, 32/)).toBeInTheDocument();
  });
});

describe('PoliticaDePrivacidadePage as a site page', () => {
  it('renders inside the site shell with its own h1', () => {
    render(<PoliticaDePrivacidadePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('has a canonical, a description and a link preview, and stays indexable before launch', () => {
    expect(metadata.alternates).toEqual({ canonical: '/politica-de-privacidade' });
    expect(metadata.description).toMatch(/LGPD/);
    expect(metadata.openGraph).toMatchObject({ url: '/politica-de-privacidade' });
    expect(metadata.robots).toBeUndefined();
  });
});
