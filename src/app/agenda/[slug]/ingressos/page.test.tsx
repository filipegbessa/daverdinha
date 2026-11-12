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
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    const noSales = {
      id: 'e9',
      title: 'Aula aberta',
      slug: 'aula-aberta',
      description: 'd',
      startsAt: '2099-01-10T13:00:00.000Z',
      endsAt: '2099-01-10T15:00:00.000Z',
      locationName: null,
      locationAddress: null,
      price: null,
      spots: null,
      imageUrl: null,
      ticketSales: false,
      maxTicketsPerOrder: 10,
      spotsLeft: null,
      soldOut: false,
    };
    global.fetch = jest.fn(async (url: string) =>
      url.endsWith('/events/aula-aberta')
        ? ({ ok: true, json: async () => noSales } as Response)
        : ({ ok: false } as Response),
    ) as jest.Mock;

    await expect(renderPage('aula-aberta')).rejects.toThrow('NEXT_REDIRECT /agenda/aula-aberta');
  });

  it('is a 404 for an unknown event', async () => {
    await expect(renderPage('nao-existe')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
