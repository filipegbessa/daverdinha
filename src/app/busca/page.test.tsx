import { mockSiteSettings } from '@/lib/__mocks__/site-settings';
import { render, screen } from '@testing-library/react';
import Page from './page';

// Sem os exemplos da prévia (saíram em 2026-11-18), a página só mostra o que
// a API devolve: aqui, o catálogo de teste.
jest.mock('@/features/site/lib/public-api', () => {
  const actual = jest.requireActual('@/features/site/lib/public-api');
  return { ...actual, ...jest.requireActual('@/features/site/test-fixtures/catalog').fixturePublicApi(actual) };
});

const renderPage = async (params: Record<string, string> = {}) =>
  render(await Page({ searchParams: Promise.resolve(params) }));

describe('/busca', () => {
  beforeEach(() => {
    mockSiteSettings({ siteEnabled: false });
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('asks for a term when there is no query', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Buscar produtos');
    expect(screen.queryByRole('link', { name: /Vaso Terracota M/ })).not.toBeInTheDocument();
  });

  it('lists what matches, ignoring accents', async () => {
    await renderPage({ q: 'jiboia' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Resultados para “jiboia”');
    expect(screen.getByRole('link', { name: /Jiboia em cuia/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Vaso Terracota M/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 produto')).toBeInTheDocument();
  });

  it('suggests the categories when nothing matches', async () => {
    await renderPage({ q: 'xablau' });

    expect(screen.getByText(/Não achamos nada/)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Categorias' })).toBeInTheDocument();
  });

  it('applies the availability filter to the results', async () => {
    await renderPage({ q: 'kit', tipo: 'in_stock' });

    expect(screen.getByText('Nenhum resultado com esse filtro.')).toBeInTheDocument();
  });
});
