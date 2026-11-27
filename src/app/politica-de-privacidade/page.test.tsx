import { render, screen, within } from '@testing-library/react';
import PoliticaDePrivacidadePage, { generateMetadata } from './page';

describe('PoliticaDePrivacidadePage', () => {
  it('explains both data sources: site analytics and WhatsApp conversations', async () => {
    render(await PoliticaDePrivacidadePage());
    expect(screen.getByText(/usamos o Google Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Conversas pelo WhatsApp:/)).toBeInTheDocument();
  });

  it('names the services that handle the data, how long it is kept and the IP log', async () => {
    render(await PoliticaDePrivacidadePage());
    for (const service of ['Pagar.me:', 'Resend:', 'Vercel e Neon:', 'WhatsApp (Meta):']) {
      expect(screen.getByText(service, { selector: 'strong' })).toBeInTheDocument();
    }
    expect(screen.getByText(/ficam guardados por 5 anos/)).toBeInTheDocument();
    expect(screen.getByText(/apagados depois de 3 anos/)).toBeInTheDocument();
    expect(screen.getByText(/registramos o endereço IP/)).toBeInTheDocument();
  });

  it('states LGPD rights and shows real contact info', async () => {
    render(await PoliticaDePrivacidadePage());
    expect(screen.getByText(/Lei Geral de Proteção de Dados/)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText(/R\. Capiberibe, 32/)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'contato@daverdinha.com.br' })).toHaveAttribute(
      'href',
      'mailto:contato@daverdinha.com.br',
    );
  });
});

describe('PoliticaDePrivacidadePage as a site page', () => {
  it('renders inside the site shell with its own h1', async () => {
    render(await PoliticaDePrivacidadePage());
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('has a canonical, a description and a link preview, and stays indexable before launch', async () => {
    const metadata = await generateMetadata();
    expect(metadata.alternates).toEqual({ canonical: '/politica-de-privacidade' });
    expect(metadata.description).toMatch(/LGPD/);
    expect(metadata.openGraph).toMatchObject({ url: '/politica-de-privacidade' });
    expect(metadata.robots).toBeUndefined();
  });
});
