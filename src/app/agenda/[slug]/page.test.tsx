import { render, screen, within } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const pastEvent = {
  id: 'e-old',
  title: 'Oficina antiga',
  slug: 'oficina-antiga',
  description: 'Já foi.',
  startsAt: '2025-01-11T13:00:00.000Z',
  endsAt: '2025-01-11T15:00:00.000Z',
  locationName: null,
  locationAddress: null,
  price: 100,
  spots: null,
  imageUrl: null,
  ctaUrl: null,
};

const renderPage = async (slug: string) => render(await Page({ params: Promise.resolve({ slug }) }));

describe('/agenda/[slug]', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    delete process.env.SITE_MODE;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    jest.restoreAllMocks();
  });

  it('shows when, where and how much, with a WhatsApp signup naming the event', async () => {
    await renderPage('oficina-de-terrario');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Oficina de terrário');
    const details = screen.getByRole('list', { name: 'Detalhes do evento' });
    expect(within(details).getByText('No ateliê')).toBeInTheDocument();
    expect(
      within(details).getByText('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030'),
    ).toBeInTheDocument();
    expect(within(details).getByText('R$ 120,00 · 8 vagas')).toBeInTheDocument();
    const signup = screen.getByRole('link', { name: 'Quero me inscrever' });
    expect(decodeURIComponent(signup.getAttribute('href')!)).toContain('*Oficina de terrário*');
  });

  // Link antigo compartilhado no Instagram cai numa página que explica.
  it('keeps a past event online, marked as over and without signup', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/events/oficina-antiga')
        ? ({ ok: true, json: async () => pastEvent } as Response)
        : ({ ok: false } as Response),
    ) as jest.Mock;

    await renderPage('oficina-antiga');

    expect(screen.getByText('Este evento já aconteceu')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument();
  });

  it('shows the place as a tag and the address below, with no separate map section', async () => {
    await renderPage('feirinha-verde-do-santo-cristo');

    expect(screen.getByText('Praça da Harmonia')).toBeInTheDocument();
    expect(screen.getByText('Praça da Harmonia, Gamboa, Rio de Janeiro')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Onde vai ser' })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/^Mapa: /)).not.toBeInTheDocument();
  });

  it('keeps visitors browsing: other events (not this one, shown compact) and the studio address', async () => {
    await renderPage('oficina-de-terrario');

    const others = screen.getByRole('region', { name: 'Outros eventos' });
    expect(others).not.toHaveTextContent('Oficina de terrário');
    expect(others).toHaveTextContent('Feirinha verde do Santo Cristo');
    expect(within(others).queryByText('Ver evento')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Onde estamos' })).toBeInTheDocument();
  });

  it('is a 404 for an unknown event', async () => {
    await expect(renderPage('nao-existe')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
