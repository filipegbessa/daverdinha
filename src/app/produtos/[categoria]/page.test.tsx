import { render, screen } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const renderPage = async (categoria: string) => render(await Page({ params: Promise.resolve({ categoria }) }));

describe('/produtos/[categoria]', () => {
  beforeEach(() => {
    delete process.env.SITE_MODE;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('opens with the category name and its intro text, then only its products', async () => {
    await renderPage('mudas');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mudas');
    expect(screen.getByText(/Mudas saudáveis, aclimatadas no ateliê/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jiboia em cuia/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Vaso Terracota M/ })).not.toBeInTheDocument();
  });

  it('marks the current category among the chips', async () => {
    await renderPage('mudas');

    const chips = screen.getByRole('navigation', { name: 'Categorias' });
    expect(chips.querySelector('[aria-current="page"]')).toHaveTextContent('Mudas');
  });

  it('is a 404 for an unknown category', async () => {
    await expect(renderPage('nao-existe')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
