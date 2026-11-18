import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DestaquesPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import { terrarioSlide } from '@/features/admin/test-fixtures/hero-slide';
import type { HeroSlideAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const kits: HeroSlideAdmin = {
  ...terrarioSlide,
  id: 's2',
  title: 'Kits prontos pra presentear',
  order: 1,
  active: false,
  live: false,
};

describe('DestaquesPage', () => {
  it('lists the slides in order, with what is on the home now', async () => {
    mockApi(() => [terrarioSlide, kits]);
    render(<DestaquesPage />);

    expect(await screen.findByText('Monte seu terrário com a gente')).toBeInTheDocument();
    expect(screen.getByText('Na home')).toBeInTheDocument();
    expect(screen.getByText('Desligado')).toBeInTheDocument();
    expect(screen.getByText(/1 está na home agora/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo destaque' })).toHaveAttribute('href', '/admin/destaques/novo');
  });

  it('moves a slide down by sending the whole new order', async () => {
    const apiFetch = mockApi((path) => (path === '/hero-slides' ? [terrarioSlide, kits] : []));
    render(<DestaquesPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Mover Monte seu terrário com a gente pra baixo' }),
    );

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/hero-slides/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: ['s2', 's1'] }),
      }),
    );
    expect(screen.getByRole('button', { name: 'Mover Monte seu terrário com a gente pra cima' })).toBeDisabled();
  });

  it('turns a slide on and off from the list', async () => {
    const apiFetch = mockApi((path) => (path === '/hero-slides' ? [terrarioSlide, kits] : kits));
    render(<DestaquesPage />);

    await userEvent.click(await screen.findByRole('switch', { name: 'Ativar Kits prontos pra presentear' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/hero-slides/s2', expect.objectContaining({ method: 'PATCH' })),
    );
    const body = apiFetch.mock.calls.find(([path]) => path === '/hero-slides/s2')?.[1]?.body as FormData;
    expect(body.get('active')).toBe('true');
  });
});
