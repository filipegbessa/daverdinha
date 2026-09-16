import { render, screen } from '@testing-library/react';
import Page from './page';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';

// Hero is an async Server Component (fetches active hero slides) — RTL can't
// resolve a nested async component synchronously, so it's mocked here. Hero has
// its own dedicated tests (Hero.test.tsx) covering the fetch/fallback/carousel logic.
jest.mock('@/features/site/components/Hero', () => ({
  Hero: () => <h1>Um cantinho verde pra chamar de seu</h1>,
}));

jest.mock('@/features/site/lib/delivery-zones', () => ({
  getCoveredDeliveryZones: jest.fn(),
}));

const mockZones = getCoveredDeliveryZones as jest.Mock;

// Page itself is an async Server Component now, so it's awaited into an
// element tree before handing it to RTL.
const renderPage = async () => render(await Page());

describe('Home page', () => {
  beforeEach(() => {
    mockZones.mockResolvedValue([{ zone: 'Centro', bairros: ['Gamboa'] }]);
  });

  it('renders the core static sections', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(screen.getByText('Onde entregamos')).toBeInTheDocument();
    expect(screen.getByText('Onde estamos')).toBeInTheDocument();
    expect(screen.getByText('Perguntas frequentes')).toBeInTheDocument();
    expect(screen.getAllByText('Daverdinha').length).toBeGreaterThan(0);
  });

  it('renders the LocalBusiness JSON-LD script tag', async () => {
    const { container } = await renderPage();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('feeds the covered zones into the structured data Google reads', async () => {
    mockZones.mockResolvedValue([
      { zone: 'Centro', bairros: ['Gamboa'] },
      { zone: 'Zona Sul', bairros: ['Botafogo'] },
    ]);

    const { container } = await renderPage();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual(['Centro', 'Zona Sul']);
  });

  it('drops the delivery section when nothing is covered, and advertises no area', async () => {
    mockZones.mockResolvedValue([]);

    const { container } = await renderPage();

    expect(screen.queryByText('Onde entregamos')).not.toBeInTheDocument();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual([]);
  });
});
