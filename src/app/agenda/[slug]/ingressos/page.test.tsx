import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import Page from './page';

const redirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: (url: string) => redirect(url),
  useRouter: () => ({ push: jest.fn() }),
}));

const renderPage = async (slug: string, quantidade?: string) =>
  render(await Page({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({ quantidade }) }));

describe('/agenda/[slug]/ingressos', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    mockSiteSettings({ siteEnabled: false });
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it('opens the ticket checkout with the quantity chosen on the event page', async () => {
    await renderPage('oficina-de-terrario', '2');

    expect(screen.getByRole('heading', { level: 1, name: 'Comprar ingresso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Participante 2')).toBeInTheDocument();
    expect(screen.queryByLabelText('Participante 3')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Oficina de terrário/ })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario',
    );
  });

  it('calls it a sign-up for a free event', async () => {
    await renderPage('feirinha-verde-do-santo-cristo');

    expect(screen.getByRole('heading', { level: 1, name: 'Inscrição' })).toBeInTheDocument();
  });

  it('sends an event without sales on the site back to its page', async () => {
    await expect(renderPage('plantar-e-brindar-kokedama')).rejects.toThrow(
      'NEXT_REDIRECT /agenda/plantar-e-brindar-kokedama',
    );
  });

  it('is a 404 for an unknown event', async () => {
    await expect(renderPage('nao-existe')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
